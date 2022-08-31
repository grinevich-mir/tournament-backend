import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import querystring from 'querystring';
import Logger, { LogClass } from '../../core/logging';
import { RetryOptions, retry } from '../../core/utilities';
import { TrustlyError } from './trustly-error';
import deepmerge from 'deepmerge';

@LogClass()
export class HttpClient {
    private readonly maxRetries = 10;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`Trustly API call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`Trustly API call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    constructor(
        private readonly accessId: string,
        private readonly accessKey: string,
        private readonly env: 'test' | 'live') {
    }

    public async get<TResponse>(path: string, parameters?: { [key: string]: string }, config?: AxiosRequestConfig): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config);
        return retry(async () => {
            try {
                const response = await axios.get<TResponse>(url, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async post<TResponse = void>(path: string, data?: any, parameters?: { [key: string]: string }, config?: AxiosRequestConfig): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config);
        return retry(async () => {
            try {
                const response = await axios.post<TResponse>(url, data, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async patch<TResponse = void>(path: string, data?: any, parameters?: { [key: string]: string }, config?: AxiosRequestConfig): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config);
        return retry(async () => {
            try {
                const response = await axios.patch<TResponse>(url, data, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async delete<TResponse = void>(path: string, parameters?: { [key: string]: string }, config?: AxiosRequestConfig): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(config);
        return retry(async () => {
            try {
                const response = await axios.delete<TResponse>(url, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    private async getUrl(path: string, parameters?: { [key: string]: string }) {
        let host = `trustly.one`;

        if (this.env === 'test')
            host = `sandbox.${host}`;

        let url = `https://${host}/api/v1/${path}`;

        if (parameters)
            url += '?' + querystring.stringify(parameters);

        return url;
    }

    private async getConfig(overrides?: AxiosRequestConfig): Promise<AxiosRequestConfig> {
        const apiKey = Buffer.from(`${this.accessId}:${this.accessKey}`).toString('base64');

        const defaults: AxiosRequestConfig = {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                authorization: `Basic ${apiKey}`
            }
        };

        if (overrides)
            return deepmerge(defaults, overrides);

        return defaults;
    }

    private handleError(err: AxiosError): Error {
        const axiosErr = err as AxiosError;

        if (axiosErr.response)
            return new TrustlyError({
                message: axiosErr.response.data?.errors || [axiosErr.response.statusText],
                statusCode: axiosErr.response.status,
                error: axiosErr.response.statusText
            });

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