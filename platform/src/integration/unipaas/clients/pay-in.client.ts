import { AxiosError } from 'axios';
import { HttpClient } from '../http-client';
import { UnipaasAuthorization, UnipaasCheckoutParams, UnipaasCheckoutResponse, UnipaasAuthorizeParams, UnipaasPayInTokenParams, UnipaasPayInTokenResponse, UnipaasAuthorizeResult } from '../interfaces';

export class PayInClient {
    constructor(
        private readonly httpClient: HttpClient) {
    }

    public async checkout(params: UnipaasCheckoutParams): Promise<UnipaasCheckoutResponse> {
        const response = await this.httpClient.post<UnipaasCheckoutResponse>('pay-ins/checkout', params);
        return response;
    }

    public async getToken(params: UnipaasPayInTokenParams): Promise<UnipaasPayInTokenResponse> {
        const response = await this.httpClient.post<UnipaasPayInTokenResponse>('pay-ins/token', params);
        return response;
    }

    public async get(id: string): Promise<UnipaasAuthorization | undefined> {
        try {
            const response = await this.httpClient.get<UnipaasAuthorization>(`pay-ins/${id}`);
            return response;
        } catch (err) {
            const axiosErr = err as AxiosError;

            if (axiosErr.response?.status === 404)
                return undefined;

            throw err;
        }
    }

    public async authorize(params: UnipaasAuthorizeParams): Promise<UnipaasAuthorizeResult> {
        return this.httpClient.post<UnipaasAuthorizeResult>('pay-ins', params);
    }
}