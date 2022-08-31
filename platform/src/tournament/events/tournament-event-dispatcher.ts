import { Singleton, Inject } from '../../core/ioc';
import { TournamentEventType } from './tournament-event-type';
import { Config, JsonSerialiser } from '../../core';
import AWS from 'aws-sdk';
import Logger from '../../core/logging';
import { Tournament } from '../tournament';

@Singleton
export class TournamentEventDispatcher {
    constructor(
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async send<T = void>(tournament: Tournament, type: TournamentEventType, payload?: T): Promise<void> {
        const body = !payload ? 'NIL' : this.serialiser.serialise(payload);
        const queueName = `tournament-${tournament.id}`;
        const queueUrl = `https://sqs.${tournament.region}.amazonaws.com/${Config.accountId}/${queueName}`;
        const sqs = new AWS.SQS({ region: Config.region });

        const request: AWS.SQS.SendMessageRequest = {
            QueueUrl: queueUrl,
            MessageBody: body,
            MessageAttributes: {
                Type: {
                    DataType: 'String',
                    StringValue: type
                },
                TournamentId: {
                    DataType: 'Number',
                    StringValue: tournament.id.toString()
                }
            }
        };

        Logger.info('Sending Tournament Event', request);
        await sqs.sendMessage(request).promise();
    }
}