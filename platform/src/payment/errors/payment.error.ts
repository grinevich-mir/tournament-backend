import { GeneralError } from '../../core';
import { ErrorName } from './error-name';

export class PaymentError extends GeneralError {
    constructor(message: string = 'Internal Server Error') {
        super(message);
        this.name = ErrorName.PaymentGeneralError;
    }
}