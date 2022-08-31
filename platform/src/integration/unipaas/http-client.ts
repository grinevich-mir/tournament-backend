import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import querystring from 'querystring';
import Logger, { LogClass } from '../../core/logging';
import { RetryOptions, retry } from '../../core/utilities';
import { UnipaasError } from './unipaas-error';

@LogClass()
export class HttpClient {
    private readonly maxRetries = 10;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`Unipaas API call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`Unipaas API call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    constructor(
        private readonly apiKey: string,
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
        const subdomain = this.env === 'test' ? 'sandbox' : 'api';
        const host = `${subdomain}.unipaas.com`;
        let url = `https://${host}/platform/${path}`;

        if (parameters)
            url += '?' + querystring.stringify(parameters);

        return url;
    }

    private async getConfig(overrides?: AxiosRequestConfig): Promise<AxiosRequestConfig> {
        const defaults: AxiosRequestConfig = {
            timeout: 15000,
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${this.apiKey}`
            }
        };

        if (overrides)
            return Object.assign({}, defaults, overrides);

        return defaults;
    }

    private handleError(err: AxiosError): Error {
        if (err.response?.data?.error)
            return new UnipaasError(err.response.data);

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