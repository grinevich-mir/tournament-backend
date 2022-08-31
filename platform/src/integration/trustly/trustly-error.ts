interface TrustlyErrorMessage {
    domain: string;
    code: number;
    message: string;
}

export class TrustlyError extends Error {
    public readonly errors: TrustlyErrorMessage[];
    public readonly statusCode: number;

    constructor(response: { statusCode: number, message: TrustlyErrorMessage[], error: string }) {
        super(response.error);
        this.errors = response.message;
        this.statusCode = response.statusCode;
    }
}