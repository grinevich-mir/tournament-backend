import { PlatformEvent } from '../../core/events';

export class UserLevelChangedEvent extends PlatformEvent {
    constructor(
        public readonly id: number,
        public readonly from: number,
        public readonly to: number) {
        super('User:LevelChanged');
    }
}