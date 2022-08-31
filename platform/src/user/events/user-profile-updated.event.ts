import { PlatformEvent } from '../../core/events';
import { UserProfileUpdate } from '../user-profile-update';

export class UserProfileUpdatedEvent extends PlatformEvent {
    constructor(
        public readonly userId: number,
        public readonly payload: UserProfileUpdate) {
        super('UserProfile:Updated');
    }
}