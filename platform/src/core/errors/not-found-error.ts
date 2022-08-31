import { GeneralError } from './general-error';
import { ErrorName } from './error-name';
import { HttpStatusCode } from '../http-status-code';

export class NotFoundError extends GeneralError {
    constructor(message: string = 'Not Found') {
      super(message);
      this.name = ErrorName.NotFound;
      this.status = HttpStatusCode.NotFound;
    }
  }