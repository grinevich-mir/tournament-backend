import { HttpClient } from '../http-client';
import { ChargifyCustomer, ChargifySubscription, CreateCustomerRequest, UpdateCustomerRequest } from '../interfaces';

export class CustomerClient {
    constructor(private readonly httpClient: HttpClient) {
    }

    public async get(id: number): Promise<ChargifyCustomer | undefined> {
        try {
            const response = await this.httpClient.get<{ customer: ChargifyCustomer }>(`customers/${id}`);
            return response.customer;
        } catch (err) {
            if (err.response?.status === 404)
                return undefined;

            throw err;
        }
    }

    public async lookup(reference: string): Promise<ChargifyCustomer | undefined> {
        try {
            const response = await this.httpClient.get<{ customer: ChargifyCustomer }>(`customers/lookup`, {
                reference
            });
            return response.customer;
        } catch (err) {
            if (err.response?.status === 404)
                return undefined;

            throw err;
        }
    }

    public async create(request: CreateCustomerRequest): Promise<ChargifyCustomer> {
        const response = await this.httpClient.post<{ customer: ChargifyCustomer }>(`customers`, request);
        return response.customer;
    }

    public async update(id: number, request: UpdateCustomerRequest): Promise<ChargifyCustomer> {
        const response = await this.httpClient.put<{ customer: ChargifyCustomer }>(`customers/${id}`, request);
        return response.customer;
    }

    public async getSubscriptions(id: number): Promise<ChargifySubscription[]> {
        const response = await this.httpClient.get<{ subscription: ChargifySubscription }[]>(`customers/${id}/subscriptions`);
        return response.map(r => r.subscription);
    }
}