import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentEnteredEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { InventoryManager, NewInventoryItem, InventoryItemType } from '@tcom/platform/lib/inventory';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { UserManager } from '@tcom/platform/lib/user';
import { LogClass } from '@tcom/platform/lib/core/logging';

// TODO: Move this into config per skin
const REWARD_ENABLED = false;
const CONSECUTIVE_PLAYED_DAYS_THRESHOLD = 5;
const CONSECUTIVE_PLAYED_DAYS_REWARD_LEVEL = 1;
const CONSECUTIVE_PLAYED_DAYS_REWARD_EXPIRATION = 7;
const CONSECUTIVE_PLAYED_DAYS_REWARD_DURATION = 1;

@Singleton
@LogClass()
class OnTournamentEnteredHandler extends PlatformEventHandler<TournamentEnteredEvent> {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly inventoryManager: InventoryManager) {
            super();
    }

    protected async process(event: Readonly<TournamentEnteredEvent>): Promise<void> {
        const payload = event.payload;

        const [playedDays, previousDaysPlayed] = await this.userManager.updateLastPlayed(payload.userId);

        if (!REWARD_ENABLED || playedDays === previousDaysPlayed)
            return;

        if (playedDays > 0 && playedDays % CONSECUTIVE_PLAYED_DAYS_THRESHOLD === 0) {
            const upgradeItem: NewInventoryItem = {
                type: InventoryItemType.Upgrade,
                userId: payload.userId,
                level: CONSECUTIVE_PLAYED_DAYS_REWARD_LEVEL,
                validDays: CONSECUTIVE_PLAYED_DAYS_REWARD_DURATION,
                expiresIn: CONSECUTIVE_PLAYED_DAYS_REWARD_EXPIRATION
            };

            await this.inventoryManager.add(upgradeItem);
        }
    }
}

export const onTournamentEntered = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentEnteredHandler).execute(event));
