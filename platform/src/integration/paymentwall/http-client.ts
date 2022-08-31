import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import querystring from 'querystring';
import Logger, { LogClass } from '../../core/logging';
import { RetryOptions, retry } from '../../core/utilities';
import { PaymentwallError } from './paymentwall-error';
import { PaymentwallRequestSigner } from './utilities';
import deepmerge from 'deepmerge';

@LogClass()
export class HttpClient {
    private readonly requestSigner = new PaymentwallRequestSigner();
    private readonly maxRetries = 10;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`Paymentwall API call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`Paymentwall API call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    constructor(
        private readonly appKey: string,
        private readonly secretKey: string
    ) { }

    public async get<TResponse>(path: string, parameters?: { [key: string]: string }, requestConfig?: AxiosRequestConfig): Promise<TResponse> {
        const url = await this.getSignedUrl(path, parameters);
        const config = await this.getConfig(requestConfig);

        return retry(async () => {
            try {
                const response = await axios.get<TResponse>(url, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async post<TResponse = void>(path: string, data: any, requestConfig?: AxiosRequestConfig): Promise<TResponse> {
        const url = await this.getUrl(path);
        const config = await this.getConfig(requestConfig);

        return retry(async () => {
            try {
                const response = await axios.post<TResponse>(url, data, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    private async getUrl(path: string) {
        return `https://api.paymentwall.com/api/${path}`;
    }

    private async getSignedUrl(path: string, parameters?: { [key: string]: string }) {
        const signedParameters = this.sign(parameters);
        return `https://api.paymentwall.com/api/${path}?${querystring.stringify(signedParameters)}`;
    }

    private sign(parameters?: { [key: string]: string }): { [key: string]: string } {
        const version = 2;

        if (!parameters)
            parameters = {};

        parameters.key = this.appKey;
        parameters.sign_version = version.toString();
        parameters.sign = this.requestSigner.sign(this.secretKey, parameters, version);

        return parameters;
    }

    private async getConfig(overrides?: AxiosRequestConfig): Promise<AxiosRequestConfig> {
        const defaults: AxiosRequestConfig = {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (overrides)
            return deepmerge(defaults, overrides);

        return defaults;
    }

    private handleError(err: AxiosError): Error {
        const axiosErr = err as AxiosError;

        if (axiosErr.response)
            return new PaymentwallError(axiosErr.response.status, axiosErr.response.statusText);

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