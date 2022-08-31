import { Consumer } from 'sqs-consumer';
import { Config, JsonSerialiser } from '@tcom/platform/lib/core';
import AWS from 'aws-sdk';
import { TournamentEventType } from '@tcom/platform/lib/tournament/events';
import { EngineManager } from './engine-manager';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { Agent } from 'https';

@LogClass()
export class TournamentEventConsumer {
    private readonly queueName: string;
    private readonly queueUrl: string;
    private readonly consumer: Consumer;
    private readonly serialiser = new JsonSerialiser();
    private readonly sqs: AWS.SQS;
    private running = false;

    constructor(
            private manager: EngineManager) {
            const tournament = manager.tournament;
            this.sqs = new AWS.SQS({ region: Config.region });
            this.queueName = `tournament-${tournament.id}`;
            this.queueUrl = `https://sqs.${Config.region}.amazonaws.com/${Config.accountId}/${this.queueName}`;

            this.consumer = Consumer.create({
                queueUrl: this.queueUrl,
                handleMessage: async (msg) => this.handleMessage(msg),
                sqs: new AWS.SQS({
                    region: Config.region,
                    httpOptions: {
                        agent: new Agent({
                            keepAlive: true
                        }),
                        timeout: 0
                    }
                }),
                messageAttributeNames: ['Type']
            });

            this.consumer.on('error', err => {
                Logger.error(err);
            });
        }

    public async init(): Promise<void> {
        if (this.running)
            return;

        Logger.info(`Creating SQS queue '${this.queueName}' in region ${Config.region}`);
        await this.sqs.createQueue({
            QueueName: this.queueName
        }).promise();

        this.consumer.start();
        this.running = true;
    }

    public async shutdown(): Promise<void> {
        this.consumer.stop();

        Logger.info(`Removing SQS queue '${this.queueName}' in region ${Config.region}`);
        try {
            await this.sqs.deleteQueue({
                QueueUrl: this.queueUrl
            }).promise();
        } catch (err) {
            Logger.error(`Failed to delete SQS queue ${this.queueUrl}`, err);
        }
    }

    private async handleMessage(msg: AWS.SQS.Message): Promise<void> {
        Logger.info('TOURNAMENT EVENT', JSON.stringify(msg));

        if (!msg.Body) {
            Logger.warn('Message did not have a body.');
            return;
        }

        if (!msg.MessageAttributes) {
            Logger.error('Message did not contain any attributes, ignoring.');
            return;
        }

        if (!msg.MessageAttributes.Type) {
            Logger.error('Message did not contain Type attribute, ignoring.');
            return;
        }

        const type = msg.MessageAttributes.Type.StringValue as TournamentEventType;

        switch (type) {
            case TournamentEventType.RoundResults:
                await this.manager.roundResults(this.serialiser.deserialise(msg.Body));
                break;

            case TournamentEventType.Complete:
                await this.manager.finalise();
                break;

            case TournamentEventType.Cancellation:
                await this.manager.cancel();
                break;

            default:
                Logger.error(`Unsupported Tournament Event Type: ${type}`);
        }
    }
}