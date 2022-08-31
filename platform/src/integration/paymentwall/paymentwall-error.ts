export class PaymentwallError extends Error {
    public readonly statusText: string;
    public readonly statusCode: number;

    constructor(statusCode: number, statusText: string) {
        super(statusText);
        this.statusText = statusText;
        this.statusCode = statusCode;
    }
}

export class PaymentwallPaymentStatusError extends Error {
    public readonly error?: string;
    public readonly code?: number;

    constructor(error?: string, code?: number) {
        super(error);
        this.error = error;
        this.code = code;
    }
}

export class PaymentwallDeliveryError extends Error {
    public readonly error?: string;
    public readonly code?: number;
    public readonly notices?: string[];

    constructor(error?: string, code?: number, notices?: string[]) {
        super(error);
        this.error = error;
        this.code = code;
        this.notices = notices;
    }
}