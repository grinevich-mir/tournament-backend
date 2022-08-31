import { PlatformEventAttributes } from './platform-event-attributes';

export abstract class PlatformEvent {
    public readonly timestamp: number;

    public get attributes(): PlatformEventAttributes {
        return {};
    }

    protected constructor(public readonly eventType: string) {
        this.timestamp = Date.now();
    }
}