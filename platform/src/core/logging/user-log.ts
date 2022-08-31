import AWS from 'aws-sdk';
import { Config } from '../config';
import uuid from 'uuid/v1';
import { SendMessageBatchRequestEntry } from 'aws-sdk/clients/sqs';
import { Singleton } from '../ioc';
import { LogOriginator } from './log-originator';
import { LogType } from './log-type';
import Logger from './logger';
import { LogContext } from './log-context';
import { LogContextResolver } from './log-context-resolver';
import { JsonSerialiser } from '../json-serialiser';
import { User } from '../../user';

let messages: UserLogMessage[] = [];

export interface UserLogMessage {
    timestamp: number;
    userId: number;
    type: LogType;
    originator: LogOriginator;
    originatorId?: string;
    application: string;
    action: string;
    data?: { [name: string]: string | number | boolean };
    user?: User;
}

class LogMessageBuilder {
    private message: UserLogMessage;

    constructor(
        type: LogType,
        userId: number,
        action: string,
        context: LogContext,
        data?: { [name: string]: string | number }) {
        this.message = {
            timestamp: Date.now(),
            type,
            userId,
            action,
            originator: context.originator,
            originatorId: context.originatorId,
            application: context.application,
            data
        };

        messages.push(this.message);
    }

    public originator(originator: LogOriginator, originatorId?: string): this {
        this.message.originator = originator;
        this.message.originatorId = originatorId;
        return this;
    }

    public data(data: { [name: string]: string | number | boolean }): this {
        if (!data || Object.keys(data).length === 0)
            return this;

        this.message.data = Object.assign({}, this.message.data || {}, data);
        return this;
    }
}

@Singleton
export class UserLog {
    public static async send(): Promise<void> {
        if (messages.length === 0)
            return;

        Logger.info(`Sending ${messages.length} user log message(s)...`);
        const serialiser = new JsonSerialiser();

        try {
            const queueUrl = `https://sqs.${Config.region}.amazonaws.com/${Config.accountId}/user-log`;
            const sqs = new AWS.SQS({ region: Config.region });
            const entries = messages.map<SendMessageBatchRequestEntry>(message => ({
                Id: uuid(),
                MessageBody: serialiser.serialise(messages),
                MessageAttributes: {
                    UserId: {
                        DataType: 'Number',
                        StringValue: message.userId.toString()
                    }
                }
            }));

            await sqs.sendMessageBatch({
                QueueUrl: queueUrl,
                Entries: entries
            }).promise();

            messages = [];
        } catch (err) {
            Logger.warn('Failed to send user log messages:', { error: err });
        }
    }

    public info(userId: number, action: string): LogMessageBuilder {
        return new LogMessageBuilder(LogType.Info, userId, action, LogContextResolver.resolve());
    }

    public success(userId: number, action: string): LogMessageBuilder {
        return new LogMessageBuilder(LogType.Success, userId, action, LogContextResolver.resolve());
    }

    public warning(userId: number, action: string): LogMessageBuilder {
        return new LogMessageBuilder(LogType.Warning, userId, action, LogContextResolver.resolve());
    }

    public error(userId: number, action: string, error: string | Error): LogMessageBuilder {
        if (error instanceof Error)
            error = error.message;

        return new LogMessageBuilder(LogType.Error, userId, action, LogContextResolver.resolve(), { error });
    }

    public async handle<T = void>(userId: number, action: string, handler: (logData: { [name: string]: string | number | boolean }) => Promise<T>): Promise<T> {
        const logData: { [name: string]: string | number | boolean } = {};

        try {
            const result = await handler(logData);
            this.success(userId, action).data(logData);
            return result;
        } catch (err) {
            this.error(userId, action, err).data(logData);
            throw err;
        }
    }
}