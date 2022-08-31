export class UnipaasError extends Error {
    public readonly errors: string[];
    public readonly statusCode: number;

    constructor(response: { statusCode: number, message: string[], error: string }) {
        super(response.error);
        this.errors = response.message;
        this.statusCode = response.statusCode;
    }
}