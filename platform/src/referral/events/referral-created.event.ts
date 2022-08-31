import { PlatformEvent } from '../../core/events';
import { Referral } from '../referral';

export class ReferralCreatedEvent extends PlatformEvent {
    constructor(public readonly referral: Referral) {
        super('Referral:Created');
    }
}