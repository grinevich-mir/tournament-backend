import { HttpStatusCode } from '../../core';
import { ErrorName } from './error-name';
import { PaymentError } from './payment.error';

export class PaymentAlreadyProcessedError extends PaymentError {
    constructor(message: string = 'Payment already processed.') {
        super(message);
        this.name = ErrorName.PaymentAlreadyProcessed;
        this.status = HttpStatusCode.Forbidden;
    }
}