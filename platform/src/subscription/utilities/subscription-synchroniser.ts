import { Subscription } from '../subscription';
import { SubscriptionEntityMapper } from '../entities/mappers';
import { Inject, Singleton } from '../../core/ioc';
import { SubscriptionRepository } from '../repositories';
import Logger, { LogClass } from '../../core/logging';
import { PlatformEventDispatcher } from '../../core/events';
import { SubscriptionStatusChangedEvent, SubscriptionTierChangedEvent } from '../events';
import { SubscriptionStatus } from '../subscription-status';
import { UserManager } from '../../user';

@Singleton
@LogClass()
export class SubscriptionSynchroniser {
    constructor(
        @Inject private readonly repository: SubscriptionRepository,
        @Inject private readonly entityMapper: SubscriptionEntityMapper,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
        }

    public async sync(current: Subscription, update: Subscription): Promise<void> {
        const newStatus = update.status;
        const currentStatus = current.status;
        update.id = current.id;
        const entity = this.entityMapper.toEntity(update);
        await this.repository.update(entity);

        if (currentStatus !== newStatus) {
            Logger.info(`Changing subscription ${current.id} status from ${currentStatus} to ${newStatus}.`);
            await this.repository.setStatus(current.id, newStatus, currentStatus);
            update.status = newStatus;
            await this.eventDispatcher.send(new SubscriptionStatusChangedEvent(current.id, update, currentStatus, newStatus));

            if (newStatus === SubscriptionStatus.Expired)
                await this.userManager.setSubscriptionState(current.userId, { subscribing: false });
        }

        if (current.tierId !== update.tierId)
            await this.eventDispatcher.send(new SubscriptionTierChangedEvent(current.id, current.tierId, update.tierId));
    }
}