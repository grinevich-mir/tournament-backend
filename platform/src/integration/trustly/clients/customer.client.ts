import { HttpClient } from '../http-client';
import { TrustlyCustomer } from '../interfaces';
import { TrustlyError } from '../trustly-error';

export class CustomerClient {
    constructor(
        private readonly httpClient: HttpClient) {
    }

    public async get(id: string): Promise<TrustlyCustomer | undefined> {
        try {
            const response = await this.httpClient.get<{ customer: TrustlyCustomer, url: string }>(`customers/${id}`);
            return response.customer;
        } catch (err) {
            if (err instanceof TrustlyError)
                if (err.statusCode === 404)
                    return undefined;

            throw err;
        }
    }

    public async getByExternalId(externalId: string): Promise<TrustlyCustomer | undefined> {
        try {
            const response = await this.httpClient.get<{ customers: TrustlyCustomer[], url: string }>(`customers`, { externalId });
            return response.customers ? response.customers[0] : undefined;
        } catch (err) {
            if (err instanceof TrustlyError)
                if (err.statusCode === 404)
                    return undefined;

            throw err;
        }
    }
}