import { Singleton, Inject } from '../core/ioc';
import { LeaderboardPrizeAward } from './leaderboard-prize-award';
import AWS from 'aws-sdk';
import { Config, JsonSerialiser } from '../core';
import Logger, { LogClass } from '../core/logging';
import { RankedPrize } from '../prize';

@Singleton
@LogClass()
export class LeaderboardPrizeAwarder {
    constructor(
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async award(id: number, userId: number, rank: number, ...prizes: RankedPrize[]): Promise<LeaderboardPrizeAward> {
        const payload: LeaderboardPrizeAward = {
            leaderboardId: id,
            userId,
            rank,
            prizes
        };

        const body = this.serialiser.serialise(payload);
        const queueName = `leaderboard-prize`;
        const queueUrl = `https://sqs.${Config.region}.amazonaws.com/${Config.accountId}/${queueName}`;
        const sqs = new AWS.SQS({ region: Config.region });

        const request: AWS.SQS.SendMessageRequest = {
            QueueUrl: queueUrl,
            MessageBody: body,
            MessageAttributes: {
                LeaderboardId: {
                    DataType: 'String',
                    StringValue: id.toString()
                },
                UserId: {
                    DataType: 'Number',
                    StringValue: userId.toString()
                }
            }
        };

        Logger.info('Sending Prize Award Requests', request);
        await sqs.sendMessage(request).promise();
        return payload;
    }
}