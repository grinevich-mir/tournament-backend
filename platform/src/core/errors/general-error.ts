import { ErrorName } from './error-name';

export class GeneralError extends Error {
    public status = 500;

    constructor(message: string = 'Internal Server Error') {
      super(message);
      this.name = ErrorName.GeneralError;
    }

    public toJSON(): any {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        stack: this.stack
      };
    }
  }