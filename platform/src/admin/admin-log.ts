import AWS from 'aws-sdk';
import { Config } from '../core/config';
import { Singleton } from '../core/ioc';
import Logger from '../core/logging/logger';
import { AdminLogMessage } from './admin-log-message';
import { JsonSerialiser } from '../core/json-serialiser';

@Singleton
export class AdminLog {

    public static async send(message: AdminLogMessage): Promise<void> {
        Logger.info(`Sending admin log...`);
        const serialiser = new JsonSerialiser();

        try {
            const queueUrl = `https://sqs.${Config.region}.amazonaws.com/${Config.accountId}/admin-log`;
            const sqs = new AWS.SQS({ region: Config.region });
            await sqs.sendMessage({
                MessageBody: serialiser.serialise(message),
                MessageAttributes: {
                    UserId: {
                        DataType: 'String',
                        StringValue: message.userId
                    }
                },
                QueueUrl: queueUrl,
            }).promise();
        } catch (err) {
            Logger.warn('Failed to send admin log:', { error: err });
        }
    }
}