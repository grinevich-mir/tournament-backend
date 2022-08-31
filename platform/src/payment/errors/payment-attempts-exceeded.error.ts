import { HttpStatusCode } from '../../core';
import { ErrorName } from './error-name';
import { PaymentError } from './payment.error';

export class PaymentAttemptsExceededError extends PaymentError {
    constructor(message: string = 'Maximum number of payment attempts exceeded.') {
        super(message);
        this.name = ErrorName.PaymentAttemptsExceeded;
        this.status = HttpStatusCode.Forbidden;
    }
}