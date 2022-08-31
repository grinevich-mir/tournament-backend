import { PayPalErrorResponse, PayPalErrorType, PayPalErrorIssueDetails } from './interfaces';

export class PayPalError extends Error {
    public readonly path?: string;
    public readonly statusCode: number;
    public readonly type: PayPalErrorType;
    public readonly message: string;
    public readonly details?: PayPalErrorIssueDetails[];

    constructor(statusCode: number, statusText: string, data: PayPalErrorResponse, path?: string) {
        super(statusText);
        this.statusCode = statusCode;
        this.path = path;
        this.type = data.name;
        this.message = data.message;
        this.details = data.details;
    }
}