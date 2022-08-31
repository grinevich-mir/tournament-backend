import { lambdaHandler, JsonSerialiser } from '@tcom/platform/lib/core';
import { Container } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { MessageController } from './message.controller';
import { TimestampedMessage } from '@tcom/platform/lib/websocket';
import moment from 'moment';

const controller = Container.get(MessageController) as MessageController;

export const messageHandler = lambdaHandler(async (event: SNSEvent): Promise<void> => {
    const serialiser = new JsonSerialiser();

    for (const record of event.Records) {
        console.log('Processing message', JSON.stringify(record));
        const message = serialiser.deserialise<TimestampedMessage>(record.Sns.Message);
        message.timestamp = moment(record.Sns.Timestamp).toDate().getTime();
        await controller.processMessage(message);
    }
});