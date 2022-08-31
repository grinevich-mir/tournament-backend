import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import Logger, { LogClass } from '../../core/logging';
import { RetryOptions, retry } from '../../core/utilities';
import { SkrillError } from './skrill-error';
import qs from 'querystring';

@LogClass()
export class HttpClient {
    private readonly maxRetries = 10;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`Skrill API call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`Skrill API call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    public async post<TResponse = void>(url: string, data: any): Promise<TResponse> {
        return retry(async () => {
            try {
                const response = await axios.post<TResponse>(url, data, this.getConfig());
                return response.data;
            } catch (err) {
                throw this.handleError(err);
            }
        }, this.maxRetries, this.retryConfig);
    }

    private getConfig(): AxiosRequestConfig {
        return {
            timeout: 15000,
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            transformRequest: (req: any) => {
                return qs.stringify(req, undefined, undefined, { encodeURIComponent: qs.unescape });
            }
        };
    }

    private handleError(err: AxiosError): Error {
        const axiosErr = err as AxiosError;

        if (axiosErr.response?.data)
            return new SkrillError(
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