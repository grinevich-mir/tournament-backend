import { Get, Route, Tags, Path, Security, Delete, Query, Response, Post, ClientController, Body } from '@tcom/platform/lib/api';
import { UserWalletAccounts, WithdrawalManager, WalletAccountManager, WithdrawalProvider } from '@tcom/platform/lib/banking';
import { WithdrawalRequestModel } from '@tcom/platform/lib/banking/models';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError, BadRequestError, ForbiddenError } from '@tcom/platform/lib/core';
import moment from 'moment';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UserAddressStatus, UserType, UserVerificationStatus } from '@tcom/platform/lib/user';
import { UpgradeConfigManager } from '@tcom/platform/lib/upgrade';
import { NewWithdrawalRequestModel, WithdrawalListModel } from '../models';

const DEFAULT_MIN_AMOUNT = 100;
const DEFAULT_TARGET_DAYS = 7;

@Tags('Withdrawals')
@Route('banking/withdrawal')
@Security('cognito')
@LogClass()
export class WithdrawalController extends ClientController {
    constructor(
        @Inject private readonly accountManager: WalletAccountManager,
        @Inject private readonly withdrawalManager: WithdrawalManager,
        @Inject private readonly upgradeConfigManager: UpgradeConfigManager) {
            super();
        }

    /**
     * @summary Gets all withdrawal requests
     */
    @Get()
    public async getAll(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<WithdrawalListModel> {
        if (pageSize > 20)
            pageSize = 20;

        const result = await this.withdrawalManager.getAll({
            userId: this.user.id,
            page,
            pageSize
        });

        const models = result.items.map<WithdrawalRequestModel>(r => ({
            id: r.id,
            provider: r.provider,
            providerRef: r.providerRef,
            amount: r.amount,
            status: r.status,
            currencyCode: r.currencyCode,
            targetCompletionTime: r.targetCompletionTime,
            completionTime: r.completionTime,
            createTime: r.createTime,
            updateTime: r.updateTime
        }));

        const list = new WithdrawalListModel(models, result.totalCount, result.page, result.pageSize);
        list.minAmount = DEFAULT_MIN_AMOUNT;

        if (this.user.currencyCode) {
            const config = await this.upgradeConfigManager.getForLevel(this.user.skinId, this.user.level);

            if (config && config.enabled && config.withdrawalMinAmounts && config.withdrawalMinAmounts[this.user.currencyCode] > 0)
                list.minAmount = config.withdrawalMinAmounts[this.user.currencyCode];
        }

        return list;
    }

    /**
     * @summary Creates a withdrawal request
     */
    @Post()
    public async add(@Body() model: NewWithdrawalRequestModel): Promise<WithdrawalRequestModel> {
        if (this.user.type === UserType.Internal)
            throw new ForbiddenError('Internal accounts cannot withdraw.');

        if (this.user.addressStatus === UserAddressStatus.Pending)
            throw new BadRequestError('User must have an address.');

        if (this.user.identityStatus !== UserVerificationStatus.Verified)
            throw new BadRequestError('User identity must be verified.');

        const account = await this.accountManager.getForUser(this.user.id, UserWalletAccounts.Withdrawable);

        if (!account)
            throw new NotFoundError('Wallet not found.');

        const amount = account.balance;
        let minAmount = DEFAULT_MIN_AMOUNT;
        let targetDays = DEFAULT_TARGET_DAYS;

        const config = await this.upgradeConfigManager.getForLevel(this.user.skinId, this.user.level);

        if (config && config.enabled) {
            if (config.withdrawalMinAmounts && config.withdrawalMinAmounts[account.currencyCode] > 0)
                minAmount = config.withdrawalMinAmounts[account.currencyCode];

            targetDays = config.withdrawalTargetDays;
        }

        if (amount < minAmount)
            throw new BadRequestError(`You must have a minimum balance of ${account.currencyCode} ${minAmount} to withdraw.`);

        const targetTime = moment().utc().add(targetDays, 'days').toDate();
        const request = await this.withdrawalManager.add({
            userId: this.user.id,
            amount,
            targetCompletionTime: targetTime,
            provider: WithdrawalProvider.PayPal, // TODO: Change once we are using different one or multiple
            providerRef: model.providerRef
        });

        return {
            id: request.id,
            provider: request.provider,
            providerRef: request.providerRef,
            amount: request.amount,
            currencyCode: request.currencyCode,
            status: request.status,
            targetCompletionTime: request.targetCompletionTime,
            createTime: request.createTime,
            updateTime: request.updateTime
        };
    }

    /**
     * @summary Cancels a withdrawal request
     */
    @Delete('{id}')
    @Response<NotFoundError>(404, 'Withdrawal request not found.')
    public async cancel(@Path() id: string): Promise<void> {
        const request = await this.withdrawalManager.get(id);

        if (!request || request.userId !== this.user.id)
            throw new NotFoundError('Withdrawal request not found.');

        await this.withdrawalManager.cancel(id);
    }
}
