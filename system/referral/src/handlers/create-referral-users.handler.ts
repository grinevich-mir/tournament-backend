import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager, User } from '@tcom/platform/lib/user';
import { ReferralUserManager } from '@tcom/platform/lib/referral';

@Singleton
@LogClass()
class CreateReferralUsersHandler {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly referralUserManager: ReferralUserManager) {
    }

    public async execute(): Promise<void> {
        const result = await this.userManager.getAll();

        for (const user of result.items)
            try {
                await this.processUser(user);
            } catch (err) {
                Logger.error(`Could not add referral user for user ${user.id}`, err);
            }
    }

    private async processUser(user: User): Promise<void> {
        const existing = await this.referralUserManager.get(user.id);

        if (existing)
            return;

        await this.referralUserManager.add(user.id, user.enabled);
    }
}

export const createReferralUsers = lambdaHandler(() => IocContainer.get(CreateReferralUsersHandler).execute());