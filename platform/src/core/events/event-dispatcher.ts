import { Singleton, Inject } from '../ioc';
import AWS from 'aws-sdk';
import { Config } from '../config';
import { PublishInput, MessageAttributeMap } from 'aws-sdk/clients/sns';
import Logger, { LogClass } from '../logging';
import { JsonSerialiser } from '../json-serialiser';
import { PlatformEvent } from './platform-event';

@Singleton
@LogClass()
export class PlatformEventDispatcher {
    constructor(
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async send(...events: PlatformEvent[]): Promise<void> {
        await Promise.all(events.map(e => this.doSend(e)));
    }

    private async doSend(event: PlatformEvent): Promise<void> {
        const region = Config.region;
        const accountId = Config.accountId;
        const sns = new AWS.SNS();
        const body = this.serialiser.serialise(event);

        Logger.info('Sending Platform Event', body);

        const attributes: MessageAttributeMap = {
            EventType: {
                DataType: 'String',
                StringValue: event.eventType
            }
        };

        for (const key of Object.keys(event.attributes))
            attributes[key] = {
                DataType: 'String',
                StringValue: event.attributes[key]
            };

        const params: PublishInput = {
            Message: body,
            TopicArn: `arn:aws:sns:${region}:${accountId}:platform-event`,
            MessageAttributes: attributes
        };
        await sns.publish(params).promise();
    }
}