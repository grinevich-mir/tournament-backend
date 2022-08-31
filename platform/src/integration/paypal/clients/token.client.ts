import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import Logger, { LogClass } from '../../../core/logging';
import { RetryOptions, retry } from '../../../core/utilities';
import { PayPalAuthorization, PayPalEnvironment } from '../interfaces';
import { PayPalAccessToken } from '../paypal-access-token';
import { PayPalError } from '../paypal-error';
import { v4 as uuid } from 'uuid';

@LogClass()
export class AccessTokenClient {
    private token: PayPalAccessToken | undefined;

    private readonly maxRetries = 10;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`PayPal Access Token call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`PayPal Access Token call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    constructor(private readonly env: PayPalEnvironment) { }

    public async get(): Promise<PayPalAccessToken> {
        if (this.token && !this.token.expired)
            return this.token;

        const config: AxiosRequestConfig = {
            timeout: 15000,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'paypal-request-id': uuid(),
                authorization: this.getBasicAuthorization()
            }
        };

        return retry(async () => {
            try {
                const response = await axios.post<PayPalAuthorization>(`${this.env.baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', config);
                this.token = new PayPalAccessToken(response.data);
                return this.token;
            } catch (err) {
                this.token = undefined;
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    private getBasicAuthorization(): string {
        const encoded = Buffer.from(`${this.env.clientId}:${this.env.clientSecret}`).toString('base64');
        return `Basic ${encoded}`;
    }

    private handleError(err: AxiosError): Error {
        const axiosErr = err as AxiosError;

        if (axiosErr.response?.data)
            return new PayPalError(
                axiosErr.response.status,
                axiosErr.response.statusText,
                axiosErr.response.data);

        return err;
    }

    private isRetryable(err: Error): boolean {
        const reqError = err as AxiosError;

        if (reqError.response?.status && [502, 503].includes(reqError.response.status))
            return true;

        if (reqError.code && ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(reqError.code))
            return true;

        return false;
    }
}