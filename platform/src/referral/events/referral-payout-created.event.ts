import { PlatformEvent } from '../../core/events';
import { ReferralReward } from '../referral-reward';

export class ReferralRewardCreatedEvent extends PlatformEvent {
    constructor(public readonly reward: ReferralReward) {
        super('Referral:Reward:Created');
    }
}