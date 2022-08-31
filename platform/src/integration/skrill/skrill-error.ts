interface SkrillErrorMessage {
    code: string;
    message: string;
}

export class SkrillError extends Error {
    public readonly statusText: string;
    public readonly statusCode: number;
    public readonly error?: SkrillErrorMessage;

    constructor(statusCode: number, statusText: string, data?: { code: string, message: string }) {
        super(statusText);
        this.statusText = statusText;
        this.statusCode = statusCode;
        this.error = data;
    }
}