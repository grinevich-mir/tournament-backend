import { HttpStatusCode } from '../../core';
import { ErrorName } from './error-name';
import { PaymentError } from './payment.error';

export class PaymentMethodDeclinedError extends PaymentError {
    constructor(message: string = `Payment method was either declined by the processor or bank, or it can't be used for this payment.`) {
        super(message);
        this.name = ErrorName.PaymentMethodDeclined;
        this.status = HttpStatusCode.Forbidden;
    }
}