import { HttpStatusCode } from '../../core';
import { ErrorName } from './error-name';
import { PaymentError } from './payment.error';

export class PaymentMethodExpiredError extends PaymentError {
    constructor(message: string = 'Payment method expired.') {
        super(message);
        this.name = ErrorName.PaymentMethodExpired;
        this.status = HttpStatusCode.Forbidden;
    }
}