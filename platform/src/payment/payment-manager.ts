import { NotFoundError, PagedResult } from '../core';
import { Inject, Singleton } from '../core/ioc';
import Logger, { LogClass } from '../core/logging';
import { Ledger, TransactionPurpose, UserWalletAccounts, WalletEntry } from '../banking';
import { NewPayment } from './new-payment';
import { Payment } from './payment';
import { PaymentFilter } from './payment-filter';
import { PaymentProvider } from './payment-provider';
import { PaymentType } from './payment-type';
import { PlatformWallets } from '../banking/platform-wallets';
import { PaymentRepository } from './repositories';
import { RequesterType } from '../banking/requester-type';
import { PlatformEventDispatcher } from '../core/events';
import { PaymentStatusChangedEvent } from './events';
import { PaymentStatus } from './payment-status';

@Singleton
@LogClass()
export class PaymentManager {
    constructor(
        @Inject private readonly repository: PaymentRepository,
        @Inject private readonly ledger: Ledger,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
        }

    public async getAll(filter?: PaymentFilter): Promise<PagedResult<Payment>> {
        return this.repository.getAll(filter);
    }

    public async get(id: number): Promise<Payment | undefined> {
        return this.repository.get(id);
    }

    public async getByProviderRef(provider: PaymentProvider, providerRef: string): Promise<Payment | undefined> {
        return this.repository.getByProviderRef(provider, providerRef);
    }

    public async add(payment: NewPayment): Promise<Payment> {
        let entry: WalletEntry | undefined;

        if (payment.status === PaymentStatus.Successful || payment.status === PaymentStatus.Refunded)
            entry = await this.transfer(payment);

        const created = await this.repository.add(payment);

        if (entry)
            await this.repository.addWalletEntry(created.id, entry.id);

        await this.eventDispatcher.send(new PaymentStatusChangedEvent(created, PaymentStatus.Pending, payment.status));
        return created;
    }

    public async update(payment: Payment): Promise<Payment> {
        const current = await this.repository.get(payment.id);

        if (!current)
            throw new NotFoundError(`Payment ${payment.id} not found.`);

        if (current.status === PaymentStatus.Pending && payment.status === PaymentStatus.Successful) {
            const entry = await this.transfer(payment);
            await this.repository.addWalletEntry(payment.id, entry.id);
        } else if (current.status === PaymentStatus.Successful && payment.status === PaymentStatus.Refunded) {
            await this.transferRefund(payment);
            payment.refundTime = new Date();
        }

        if (current.status !== payment.status)
            await this.eventDispatcher.send(new PaymentStatusChangedEvent(payment, current.status, payment.status));

        return this.repository.update(payment);
    }

    public async refund(id: number, memo?: string): Promise<void> {
        const payment = await this.get(id);

        if (!payment)
            throw new NotFoundError('Payment not found.');

        if (payment.status !== PaymentStatus.Successful) {
            Logger.error('Attempted to refund a non successful payment.');
            return;
        }

        await this.transferRefund(payment, memo);
        await this.repository.setStatus(payment.id, PaymentStatus.Refunded, memo);
    }

    private async transfer(payment: NewPayment | Payment): Promise<WalletEntry> {
        const userAccount = payment.type === PaymentType.Subscription ? UserWalletAccounts.Subscription : UserWalletAccounts.Escrow;
        const purpose = this.mapTransactionPurpose(payment.type);
        const sourceAccount = payment.type === PaymentType.Refund ? PlatformWallets.Corporate : this.mapProviderWallet(payment.provider);
        const targetAccount = payment.type !== PaymentType.Refund ? PlatformWallets.Corporate : this.mapProviderWallet(payment.provider);

        let externalRef = `${payment.provider}:${payment.providerRef}`;

        if (payment.type === PaymentType.Refund)
            externalRef += ':Refund';

        return this.ledger.transfer(payment.amount, payment.currencyCode)
            .purpose(purpose)
            .requestedBy(RequesterType.System, payment.provider)
            .externalRef(externalRef)
            .memo(payment.memo || null as unknown as string)
            .fromPlatform(sourceAccount)
            .toUser(payment.userId, userAccount)
            .toPlatform(targetAccount)
            .commit();
    }

    private async transferRefund(payment: Payment, memo?: string): Promise<void> {
        const userAccount = payment.type === PaymentType.Subscription ? UserWalletAccounts.Subscription : UserWalletAccounts.Escrow;
        const purpose = this.mapTransactionPurpose(payment.type);
        const sourceAccount = PlatformWallets.Corporate;
        const targetAccount = this.mapProviderWallet(payment.provider);

        const entry = await this.ledger.transfer(payment.amount, payment.currencyCode)
            .purpose(purpose)
            .requestedBy(RequesterType.System, payment.provider)
            .externalRef(`${payment.provider}:${payment.providerRef}:Refund`)
            .memo(memo || null as unknown as string)
            .fromPlatform(sourceAccount)
            .toUser(payment.userId, userAccount)
            .toPlatform(targetAccount)
            .commit();

        await this.repository.addWalletEntry(payment.id, entry.id);
    }

    private mapTransactionPurpose(paymentType: PaymentType): TransactionPurpose {
        switch (paymentType) {
            case PaymentType.Subscription:
                return TransactionPurpose.Subscription;

            case PaymentType.Purchase:
                return TransactionPurpose.Purchase;

            case PaymentType.Refund:
                return TransactionPurpose.Refund;
        }
    }

    private mapProviderWallet(provider: PaymentProvider): PlatformWallets {
        switch (provider) {
            case PaymentProvider.Chargify:
                return PlatformWallets.Chargify;

            case PaymentProvider.Unipaas:
                return PlatformWallets.Unipaas;

            case PaymentProvider.Trustly:
                return PlatformWallets.Trustly;

            case PaymentProvider.PayPal:
                return PlatformWallets.PayPal;

            case PaymentProvider.Skrill:
                return PlatformWallets.Skrill;

            case PaymentProvider.Paymentwall:
                return PlatformWallets.Paymentwall;
        }
    }
}