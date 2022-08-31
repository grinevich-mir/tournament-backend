import { GeneralError } from './general-error';
import { ErrorName } from './error-name';
import { HttpStatusCode } from '../http-status-code';

export class UnauthorizedError extends GeneralError {
    constructor(message: string = 'Unauthorized') {
      super(message);
      this.name = ErrorName.Unauthorized;
      this.status = HttpStatusCode.Unauthorized;
    }
  }