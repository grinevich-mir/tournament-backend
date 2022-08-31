import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import querystring from 'querystring';
import Logger, { LogClass } from '../../core/logging';
import { RetryOptions, retry } from '../../core/utilities';
import { AccessTokenClient } from './clients/token.client';
import { PayPalEnvironment } from './interfaces';
import { PayPalError } from './paypal-error';
import { v4 as uuid } from 'uuid';

export interface HttpClientParams {
    path: string;
    data?: any;
    parameters?: { [key: string]: string };
    config?: AxiosRequestConfig;
    headers?: { [key: string]: string };
}

@LogClass()
export class HttpClient {
    private readonly maxRetries = 10;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`PayPal API call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`PayPal API call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    constructor(readonly env: PayPalEnvironment, readonly token: AccessTokenClient) { }

    public async get<TResponse>({ path, parameters, config, headers }: HttpClientParams): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config, headers);
        return retry(async () => {
            try {
                const response = await axios.get<TResponse>(url, config);
                return response.data;
            } catch (err) {
                throw this.handleError(path, err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async post<TResponse = void>({ path, data, parameters, config, headers }: HttpClientParams): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config, headers);
        return retry(async () => {
            try {
                const response = await axios.post<TResponse>(url, data, config);
                return response.data;
            } catch (err) {
                throw this.handleError(path, err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async patch<TResponse = void>({ path, data, parameters, config, headers }: HttpClientParams): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config, headers);
        return retry(async () => {
            try {
                const response = await axios.patch<TResponse>(url, data, config);
                return response.data;
            } catch (err) {
                throw this.handleError(path, err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async delete<TResponse = void>({ path, parameters, config, headers }: HttpClientParams): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config, headers);
        return retry(async () => {
            try {
                const response = await axios.delete<TResponse>(url, config);
                return response.data;
            } catch (err) {
                throw this.handleError(path, err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    private async getUrl(path: string, parameters?: { [key: string]: string }) {
        let url = `${this.env.baseUrl}/${path}`;

        if (parameters)
            url += '?' + querystring.stringify(parameters);

        return url;
    }

    private async getConfig(overrides?: AxiosRequestConfig, headers?: { [key: string]: string }): Promise<AxiosRequestConfig> {
        const token = await this.token.get();

        let defaults: AxiosRequestConfig = {
            timeout: 15000,
            headers: {
                'content-type': 'application/json',
                'paypal-request-id': uuid(),
                authorization: token.value
            }
        };

        if (headers)
            defaults.headers = Object.assign({}, defaults.headers, headers);

        if (overrides)
            defaults = Object.assign({}, defaults, overrides);

        return defaults;
    }

    private handleError(path: string, err: AxiosError): Error {
        const axiosErr = err as AxiosError;

        if (axiosErr.response?.data)
            return new PayPalError(
                axiosErr.response.status,
                axiosErr.response.statusText,
                axiosErr.response.data,
                path
            );

        return err;
    }

    private isRetryable(err: Error): boolean {
        const reqError = err as AxiosError;

        if (reqError.response?.status && [401, 502, 503].includes(reqError.response.status))
            return true;

        if (reqError.code && ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(reqError.code))
            return true;

        return false;
    }
}