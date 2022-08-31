import { Singleton, Inject } from '../../core/ioc';
import { ParameterStore, Config } from '../../core';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import querystring from 'querystring';
import { SignatureGenerator } from './signature-generator';
import Logger, { LogClass } from '../../core/logging';
import { RetryOptions, retry } from '../../core/utilities';

@Singleton
@LogClass()
export class HttpClient {
    private readonly maxRetries = 10;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`Blackjack API call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`Blackjack API call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly sigGenerator: SignatureGenerator) {
    }

    public async get<TResponse>(path: string, parameters?: { [key: string]: string }, config?: AxiosRequestConfig) {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(undefined, config);
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
        config = await this.getConfig(data, config);
        return retry(async () => {
            try {
                const response = await axios.post<TResponse>(url, data, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async put<TResponse = void>(path: string, data?: any, parameters?: { [key: string]: string }, config?: AxiosRequestConfig): Promise<TResponse> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(data, config);
        return retry(async () => {
            try {
                const response = await axios.put<TResponse>(url, data, config);
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    public async delete(path: string, parameters?: { [key: string]: string }, config?: AxiosRequestConfig): Promise<void> {
        const url = await this.getUrl(path, parameters);
        config = await this.getConfig(undefined, config);
        return retry(async () => {
            try {
                const response = await axios.delete(url, config);
                return response.data;
            } catch (err) {
                if (err.response && err.response.data && err.response.data.message)
                    err.message = err.response.data.message;

                throw err;
            }
        }, this.maxRetries, this.retryConfig);
    }

    private async getUrl(path: string, parameters?: { [key: string]: string }) {
        const host = await this.getParameter('api-host');
        let url = `https://${host}/${path}`;

        if (parameters)
            url += '?' + querystring.stringify(parameters);

        return url;
    }

    private async getConfig(body?: any, overrides?: AxiosRequestConfig): Promise<AxiosRequestConfig> {
        const operatorKey = await this.getParameter('operator-key', true);
        const signature = await this.sigGenerator.generate(body);
        const defaults: AxiosRequestConfig = {
            timeout: 15000,
            headers: {
                'content-type': 'application/json',
                'x-tcom-key': operatorKey,
                'x-tcom-sig': signature
            }
        };

        if (overrides)
            return Object.assign({}, defaults, overrides);

        return defaults;
    }

    private async getParameter(name: string, decrypt: boolean = false): Promise<string> {
        return this.parameterStore.get(`/${Config.stage}/integration/blackjack/${name}`, decrypt, true);
    }

    private handleError(err: AxiosError): Error {
        if (err.response && err.response.data && err.response.data.message)
            err.message = err.response.data.message;

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
