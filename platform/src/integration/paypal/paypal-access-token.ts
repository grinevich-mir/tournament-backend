import { PayPalAuthorization } from './interfaces';

const EXPIRATION_THRESHOLD = 500;

export class PayPalAccessToken {
    private readonly token: string;
    private readonly type: string;
    private readonly expiresIn: number;
    private readonly createTime: number;

    public get value(): string {
        return `${this.type} ${this.token}`;
    }

    public get expired(): boolean {
        return Date.now() > this.createTime + this.expiresIn - EXPIRATION_THRESHOLD;
    }

    constructor(auth: PayPalAuthorization) {
        this.type = auth.token_type;
        this.token = auth.access_token;
        this.createTime = Date.now();
        this.expiresIn = auth.expires_in * 1000;
    }
}