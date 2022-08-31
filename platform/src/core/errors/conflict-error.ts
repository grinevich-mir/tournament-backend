import { GeneralError } from './general-error';
import { ErrorName } from './error-name';
import { HttpStatusCode } from '../http-status-code';

export class ConflictError extends GeneralError {
    constructor(message: string = 'Conflict') {
      super(message);
      this.name = ErrorName.Conflict;
      this.status = HttpStatusCode.Conflict;
    }
  }