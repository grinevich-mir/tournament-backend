import { HttpStatusCode } from '../../core';
import { ErrorName } from './error-name';
import { PaymentError } from './payment.error';

export class PaymentPayerAccountError extends PaymentError {
    constructor(message: string = 'Issue with external payer account.') {
        super(message);
        this.name = ErrorName.PaymentPayerAccount;
        this.status = HttpStatusCode.Forbidden;
    }
}