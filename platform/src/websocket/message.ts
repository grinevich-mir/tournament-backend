import { MessageTarget } from './message-target';

export interface Message {
    $target: MessageTarget;
    type: string;
    payload: any;
}

export interface TypedMessage<T> extends Message {
    payload: T;
}

export interface TargettedMessage<T extends MessageTarget> extends Message {
    $target: T;
}

export interface TimestampedMessage extends Message {
    timestamp: number;
}