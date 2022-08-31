import { PlatformEvent, PlatformEventAttributes } from '../../core/events';
import { User } from '../user';
import { UserProfile } from '../user-profile';

export class UserCreatedEvent extends PlatformEvent {
    public get attributes(): PlatformEventAttributes {
        return {
            HasReferredCode: this.referredCode ? 'true' : 'false'
        };
    }

    constructor(
        public readonly user: User,
        public readonly profile: UserProfile,
        public readonly referredCode?: string) {
        super('User:Created');
    }
}
