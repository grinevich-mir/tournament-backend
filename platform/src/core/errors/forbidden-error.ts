import { GeneralError } from './general-error';
import { ErrorName } from './error-name';
import { HttpStatusCode } from '../http-status-code';

export class ForbiddenError extends GeneralError {
    constructor(message: string = 'Forbidden') {
      super(message);
      this.name = ErrorName.Forbidden;
      this.status = HttpStatusCode.Forbidden;
    }
  }