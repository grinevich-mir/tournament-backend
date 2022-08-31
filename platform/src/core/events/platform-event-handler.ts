import { SNSEvent } from 'aws-lambda';
import { PlatformEvent } from './platform-event';
import Logger from '../logging';
import { JsonSerialiser } from '../json-serialiser';

export abstract class PlatformEventHandler<T extends PlatformEvent> {
    public async execute(event: SNSEvent): Promise<void> {
        const serialiser = new JsonSerialiser();
        const message = event.Records[0].Sns.Message;
        const platformEvent = serialiser.deserialise<T>(message);
        Logger.info('Platform Event Received', platformEvent);
        return this.process(platformEvent);
    }

    protected abstract process(event: Readonly<T>): Promise<void>;
}