import { Singleton, Inject } from '../core/ioc';
import { WithdrawalRequestRepository } from './repositories';
import { Ledger } from './ledger';
import { TransactionPurpose } from './transaction-purpose';
import { RequesterType } from './requester-type';
import { UserWalletAccounts } from './user-wallet-accounts';
import { BadRequestError, InsufficientFundsError, NotFoundError, PagedResult, Redis } from '../core';
import { WithdrawalRequestEntity } from './entities';
import { WithdrawalRequestStatus } from './withdrawal-request-status';
import { WalletAccountManager } from './wallet-account-manager';
import { WithdrawalRequest, NewWithdrawalRequest } from './withdrawal-request';
import { WithdrawalRequestEntityMapper } from './entities/mappers';
import { WithdrawalRequestFilter } from './withdrawal-request-filter';
import { LogClass } from '../core/logging';
import { PlatformWallets } from './platform-wallets';
import { WithdrawalProvider } from './withdrawal-provider';
import * as EmailValidator from 'email-validator';
import { PlatformEventDispatcher } from '../core/events';
import { WithdrawalRequestAddedEvent, WithdrawalRequestStatusChangedEvent } from './events';
import { WithdrawalRequestStatusChangeResult } from './withdrawal-request-status-change-result';

const LOCK_TTL = 30000;

@Singleton
@LogClass()
export class WithdrawalManager {
    constructor(
        @Inject private readonly requestRepository: WithdrawalRequestRepository,
        @Inject private readonly accountManager: WalletAccountManager,
        @Inject private readonly entityMapper: WithdrawalRequestEntityMapper,
        @Inject private readonly ledger: Ledger,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher,
        @Inject private readonly redis: Redis) {
    }

    public async getAll(filter?: WithdrawalRequestFilter): Promise<PagedResult<WithdrawalRequest>> {
        const result = await this.requestRepository.getAll(filter);
        const items = result.items.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(items, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: string): Promise<WithdrawalRequest | undefined> {
        const entity = await this.requestRepository.get(id);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getMany(...ids: string[]): Promise<WithdrawalRequest[]> {
        const entities = await this.requestRepository.getMany(...ids);

        if (entities.length === 0)
            return [];

        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async add(newRequest: NewWithdrawalRequest, employeeId?: string): Promise<WithdrawalRequest> {
        this.validate(newRequest);

        const account = await this.accountManager.getForUser(newRequest.userId, UserWalletAccounts.Withdrawable);

        if (!account)
            throw new BadRequestError('Withdrawable account not found.');

        if (newRequest.amount === 0 || account.balance - newRequest.amount < 0)
            throw new InsufficientFundsError();

        return this.redis.lock(this.getUserLockKey(newRequest.userId), async () => {
            const requesterType = employeeId ? RequesterType.Employee : RequesterType.User;
            const requesterId = employeeId || newRequest.userId;

            const entry = await this.ledger.transfer(newRequest.amount, account.currencyCode)
                .purpose(TransactionPurpose.Withdrawal)
                .requestedBy(requesterType, requesterId)
                .memo(`Withdrawal requested`)
                .fromUser(newRequest.userId, UserWalletAccounts.Withdrawable)
                .toUser(newRequest.userId, UserWalletAccounts.Escrow)
                .commit();

            const entity = new WithdrawalRequestEntity();
            entity.userId = newRequest.userId;
            entity.amount = newRequest.amount;
            entity.requesterType = requesterType;
            entity.requesterId = requesterId.toString();
            entity.provider = newRequest.provider;
            entity.providerRef = newRequest.providerRef;
            entity.currencyCode = account.currencyCode;
            entity.targetCompletionTime = newRequest.targetCompletionTime;
            entity.walletEntryId = entry.id;
            const created = await this.requestRepository.add(entity);

            await this.eventDispatcher.send(new WithdrawalRequestAddedEvent(created.id));
            return this.entityMapper.fromEntity(created);
        }, LOCK_TTL);
    }

    public async processing(id: string, employeeId?: string): Promise<void> {
        const request = await this.requestRepository.get(id);

        if (!request)
            throw new NotFoundError('Withdrawal request not found.');

        if (![WithdrawalRequestStatus.Pending, WithdrawalRequestStatus.Complete].includes(request.status))
            throw new BadRequestError('Withdrawal request not in pending or complete state.');

        await this.redis.lock(this.getUserLockKey(request.userId), async () => {
            if (request.status === WithdrawalRequestStatus.Complete) {
                const requesterType = employeeId ? RequesterType.Employee : RequesterType.System;
                const requesterId = employeeId || request.provider;
                const sourceWallet = this.getProviderPlatformWallet(request.provider);

                await this.ledger.transfer(request.amount, request.currencyCode)
                    .purpose(TransactionPurpose.Withdrawal)
                    .requestedBy(requesterType, requesterId)
                    .linkedTo(request.walletEntryId)
                    .memo(`Withdrawal reverted`)
                    .fromPlatform(sourceWallet)
                    .toUser(request.userId, UserWalletAccounts.Escrow)
                    .commit();
            }

            await this.requestRepository.setStatus(id, WithdrawalRequestStatus.Processing);
            await this.eventDispatcher.send(new WithdrawalRequestStatusChangedEvent(id, WithdrawalRequestStatus.Processing));
        }, LOCK_TTL);
    }

    public async complete(id: string, employeeId?: string): Promise<void> {
        const request = await this.requestRepository.get(id);

        if (!request)
            throw new NotFoundError('Withdrawal request not found.');

        if (request.status !== WithdrawalRequestStatus.Processing)
            throw new BadRequestError('Withdrawal request not in processing state.');

        await this.redis.lock(this.getUserLockKey(request.userId), async () => {
            const requesterType = employeeId ? RequesterType.Employee : RequesterType.System;
            const requesterId = employeeId || request.provider;
            const destinationWallet = this.getProviderPlatformWallet(request.provider);

            await this.ledger.transfer(request.amount, request.currencyCode)
                .purpose(TransactionPurpose.Withdrawal)
                .requestedBy(requesterType, requesterId)
                .linkedTo(request.walletEntryId)
                .memo(`Withdrawal completed`)
                .fromUser(request.userId, UserWalletAccounts.Escrow)
                .toPlatform(destinationWallet)
                .commit();

            await this.requestRepository.setStatus(id, WithdrawalRequestStatus.Complete);
            await this.eventDispatcher.send(new WithdrawalRequestStatusChangedEvent(id, WithdrawalRequestStatus.Complete));
        }, LOCK_TTL);
    }

    public async cancel(id: string, employeeId?: string): Promise<void> {
        const request = await this.requestRepository.get(id);

        if (!request)
            throw new NotFoundError('Withdrawal request not found.');

        if (!employeeId && request.status === WithdrawalRequestStatus.Processing)
            throw new BadRequestError('Withdrawal request is being processed.');

        if (request.status === WithdrawalRequestStatus.Complete)
            throw new BadRequestError('Withdrawal request has already been completed.');

        if (request.status === WithdrawalRequestStatus.Cancelled)
            throw new BadRequestError('Withdrawal request has already been cancelled.');

        await this.redis.lock(this.getUserLockKey(request.userId), async () => {
            const requesterType = employeeId ? RequesterType.Employee : RequesterType.User;
            const requesterId = employeeId || request.userId;

            await this.ledger.transfer(request.amount, request.currencyCode)
                .purpose(TransactionPurpose.Withdrawal)
                .requestedBy(requesterType, requesterId)
                .linkedTo(request.walletEntryId)
                .memo(`Withdrawal cancelled`)
                .fromUser(request.userId, UserWalletAccounts.Escrow)
                .toUser(request.userId, UserWalletAccounts.Withdrawable)
                .commit();

            await this.requestRepository.setStatus(id, WithdrawalRequestStatus.Cancelled);
            await this.eventDispatcher.send(new WithdrawalRequestStatusChangedEvent(id, WithdrawalRequestStatus.Cancelled));
        }, LOCK_TTL);
    }

    public async bulkChangeStatus(status: WithdrawalRequestStatus, ids: string[], employeeId?: string): Promise<WithdrawalRequestStatusChangeResult[]> {
        let changes: Promise<WithdrawalRequestStatusChangeResult>[];

        switch (status) {
            case WithdrawalRequestStatus.Processing:
                changes = ids.map((id: string) => this.getStatusChangeResult(id, this.processing(id)));
                break;

            case WithdrawalRequestStatus.Complete:
                changes = ids.map((id: string) => this.getStatusChangeResult(id, this.complete(id, employeeId)));
                break;

            default:
                throw new BadRequestError(`Withdrawal request status '${status}' is not supported.`);
        }

        return Promise.all(changes);
    }

    private async getStatusChangeResult(id: string, changeOperation: Promise<void>): Promise<WithdrawalRequestStatusChangeResult> {
        const model: WithdrawalRequestStatusChangeResult = { id, success: false };

        return changeOperation
            .then(() => {
                model.success = true;
                return model;
            })
            .catch((reason: Error) => {
                model.message = reason.message;
                return model;
            });
    }

    private getProviderPlatformWallet(provider: WithdrawalProvider): PlatformWallets {
        switch (provider) {
            case WithdrawalProvider.PayPal:
                return PlatformWallets.PayPal;
        }
    }

    private validate(request: NewWithdrawalRequest): void {
        switch (request.provider) {
            case WithdrawalProvider.PayPal:
                if (!request.providerRef || !EmailValidator.validate(request.providerRef))
                    throw new BadRequestError('A valid PayPal email address must be provided.');
                break;
        }
    }

    private getUserLockKey(userId: number) {
        return `BANKING:WITHDRAWALS:USER:${userId}`;
    }
}