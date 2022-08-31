import { GeneralError } from './general-error';
import { ErrorName } from './error-name';
import { HttpStatusCode } from '../http-status-code';

export class NotImplementedError extends GeneralError {
    constructor(message: string = 'Not Implemented') {
      super(message);
      this.name = ErrorName.NotImplemented;
      this.status = HttpStatusCode.NotImplemented;
    }
  }