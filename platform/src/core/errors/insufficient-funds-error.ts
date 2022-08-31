import { HttpStatusCode } from '../http-status-code';
import { ErrorName } from './error-name';
import { GeneralError } from './general-error';

export class InsufficientFundsError extends GeneralError {
    constructor(message: string = 'Insufficient Funds') {
        super(message);
        this.name = ErrorName.InsufficientFunds;
        this.status = HttpStatusCode.PaymentRequired;
      }
}