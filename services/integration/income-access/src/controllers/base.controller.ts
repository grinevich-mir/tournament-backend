import { BadRequestError } from '@tcom/platform/lib/core';
import { APIGatewayEvent } from 'aws-lambda';
import moment from 'moment';

export abstract class BaseController {
    protected getDateRange(event: APIGatewayEvent): { from: Date, to: Date } {
        if (!event.body)
            throw new Error('Event body cannot be empty.');

        const jsonBody = JSON.parse(event.body);

        if (!jsonBody.fromDate || !jsonBody.toDate)
            throw new BadRequestError('fromDate and/or toDate not supplied.');

        const from = moment(jsonBody.fromDate, 'YYYYMMDD');
        const to = moment(jsonBody.toDate, 'YYYYMMDD');

        if (!from.isValid() || !to.isValid())
            throw new BadRequestError('fromDate and/or toDate not valid.');

        return {
            from: from.toDate(),
            to: to.endOf('day').toDate()
        };
    }
}