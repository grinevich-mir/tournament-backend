import { HttpClient } from '../http-client';
import { TrustlyEstablishParams, TrustlyEstablishResponse, TrustlyTransaction, TrustlyTransactionCaptureParams, TrustlyTransactionListParams, TrustlyTransactionListResponse, TrustlyTransactionPreAuthParams } from '../interfaces';
import qs from 'querystring';

export class TransactionClient {
    constructor(
        private readonly httpClient: HttpClient) {
    }

    public async establish(params: TrustlyEstablishParams): Promise<TrustlyEstablishResponse> {
        const response = await this.httpClient.post<TrustlyEstablishResponse>('establish', params, {
            notify: 'false'
        });
        return response;
    }

    public async get(id: string): Promise<TrustlyTransaction> {
        const response = await this.httpClient.get<{ transaction: TrustlyTransaction, url: string }>(`transactions/${id}`);
        return response.transaction;
    }

    public async list(params?: TrustlyTransactionListParams): Promise<TrustlyTransactionListResponse> {
        let data: any | undefined;

        if (params) {
            const dataStr = qs.stringify(params as any);
            data = qs.parse(dataStr) as any;
        }

        return this.httpClient.get<TrustlyTransactionListResponse>(`transactions`, data);
    }

    public async preAuth(transactionId: string, params: TrustlyTransactionPreAuthParams): Promise<TrustlyTransaction> {
        const data = qs.stringify(params as any);

        const response = await this.httpClient.post<{ transaction: TrustlyTransaction }>(`transactions/${transactionId}/capture/preAuth`, data, undefined, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.transaction;
    }

    public async capture(transactionId: string, params: TrustlyTransactionCaptureParams): Promise<TrustlyTransaction> {
        const data = qs.stringify(params as any);

        const response = await this.httpClient.post<{ transaction: TrustlyTransaction }>(`transactions/${transactionId}/capture`, data, undefined, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.transaction;
    }
}