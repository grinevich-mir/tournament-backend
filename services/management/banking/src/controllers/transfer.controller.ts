import { AdminController, Body, Path, Post, Route, Security, Tags } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { Ledger, PlatformWallets, UserWalletAccounts, WalletEntry } from '@tcom/platform/lib/banking';
import { TransferModel } from '../models/transfer.model';
import { RequesterType } from '@tcom/platform/lib/banking/requester-type';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager } from '@tcom/platform/lib/user';
import { ForbiddenError, NotFoundError } from '@tcom/platform/lib/core';

@Tags('Transfers')
@Route('banking/transfer')
@Security('admin', ['banking:transfer:write'])
@LogClass()
export class TransferController extends AdminController {
    constructor(
        @Inject private readonly ledger: Ledger,
        @Inject private readonly userManager: UserManager) {
        super();
    }

    /**
     * @summary Add diamonds to wallet
     */
    @Post('diamond/credit')
    public async diamondsCredit(@Body() transfer: TransferModel): Promise<WalletEntry> {
        return this.ledger.transfer(transfer.amount, 'DIA')
            .purpose(transfer.purpose)
            .requestedBy(RequesterType.Employee, this.user.id)
            .memo(transfer.memo)
            .fromPlatform(PlatformWallets.Corporate)
            .toUser(transfer.userId, UserWalletAccounts.Diamonds)
            .commit();
    }

    /**
     * @summary Remove diamonds from wallet
     */
    @Post('diamond/debit')
    public async diamondsDebit(@Body() transfer: TransferModel): Promise<WalletEntry> {
        return this.ledger.transfer(transfer.amount, 'DIA')
            .purpose(transfer.purpose)
            .requestedBy(RequesterType.Employee, this.user.id)
            .memo(transfer.memo)
            .fromUser(transfer.userId, UserWalletAccounts.Diamonds)
            .toPlatform(PlatformWallets.Corporate)
            .commit();
    }

    /**
     * @summary Move diamonds between accounts
     */
    @Post('diamond/merge/{toUserId}')
    public async diamondsMerge(@Body() transfer: TransferModel, @Path() toUserId: number): Promise<WalletEntry> {
        const user = await this.userManager.get(toUserId);

        if (!user)
            throw new NotFoundError('User not found.');

        if (!user.enabled)
            throw new ForbiddenError('User disabled.');

        return this.ledger.transfer(transfer.amount, 'DIA')
            .purpose(transfer.purpose)
            .requestedBy(RequesterType.Employee, this.user.id)
            .memo(transfer.memo)
            .fromUser(transfer.userId, UserWalletAccounts.Diamonds)
            .toUser(toUserId, UserWalletAccounts.Diamonds)
            .commit();
    }

    /**
     * @summary Add to withdrawable
     */
    @Post('balance/credit')
    public async balanceCredit(@Body() transfer: TransferModel): Promise<WalletEntry> {
        return this.ledger.transfer(transfer.amount, 'USD')
            .purpose(transfer.purpose)
            .requestedBy(RequesterType.Employee, this.user.id)
            .memo(transfer.memo)
            .fromPlatform(PlatformWallets.Corporate)
            .toUser(transfer.userId, UserWalletAccounts.Withdrawable)
            .commit();
    }

    /**
     * @summary Remove from withdrawable
     */
    @Post('balance/debit')
    public async balanceDebit(@Body() transfer: TransferModel): Promise<WalletEntry> {
        return this.ledger.transfer(transfer.amount, 'USD')
            .purpose(transfer.purpose)
            .requestedBy(RequesterType.Employee, this.user.id)
            .memo(transfer.memo)
            .fromUser(transfer.userId, UserWalletAccounts.Withdrawable)
            .toPlatform(PlatformWallets.Corporate)
            .commit();
    }

    /**
     * @summary Move withdrawable between accounts
     */
    @Post('balance/merge/{toUserId}')
    public async balanceMerge(@Body() transfer: TransferModel, @Path() toUserId: number): Promise<WalletEntry> {
        const user = await this.userManager.get(toUserId);

        if (!user)
            throw new NotFoundError('User not found.');

        if (!user.enabled)
            throw new ForbiddenError('User disabled.');

        return this.ledger.transfer(transfer.amount, 'USD')
            .purpose(transfer.purpose)
            .requestedBy(RequesterType.Employee, this.user.id)
            .memo(transfer.memo)
            .fromUser(transfer.userId, UserWalletAccounts.Withdrawable)
            .toUser(toUserId, UserWalletAccounts.Withdrawable)
            .commit();
    }
}