import { GeneralError } from './general-error';
import { ErrorName } from './error-name';

export class TimeoutError extends GeneralError {
    constructor(message: string = 'Timeout Error') {
        super(message);
        this.name = ErrorName.Timeout;
      }
}