import { GeneralError } from './general-error';
import { ErrorName } from './error-name';
import { HttpStatusCode } from '../http-status-code';

export class BadRequestError extends GeneralError {
    constructor(message: string = 'Bad Request') {
      super(message);
      this.name = ErrorName.BadRequest;
      this.status = HttpStatusCode.BadRequest;
    }
  }