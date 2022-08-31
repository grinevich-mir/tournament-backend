import { Singleton, Inject } from '../core/ioc';
import { Config, JsonSerialiser } from '../core';
import { MessageTarget } from './message-target';
import { TypedMessage } from './message';
import AWS from 'aws-sdk';
import Logger, { LogClass } from '../core/logging';

@Singleton
@LogClass()
export class Websocket {
    constructor(
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async send<T>(target: MessageTarget, type: string, payload: T): Promise<void> {
        const region = Config.region;
        const accountId = Config.accountId;

        const message: TypedMessage<T> = {
            $target: target,
            type,
            payload
        };

        Logger.info('Sending Websocket Message', message);

        const sns = new AWS.SNS();
        const params = {
            Message: this.serialiser.serialise(message),
            TopicArn: `arn:aws:sns:${region}:${accountId}:websocket`
        };

        await sns.publish(params).promise();
    }
}