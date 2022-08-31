import { HttpClient } from '../http-client';
import { ChargifySubscription, CreateSubscriptionRequest, UpdateSubscriptionRequest } from '../interfaces';

export class SubscriptionClient {
    constructor(private readonly httpClient: HttpClient) {
    }

    public async get(id: number): Promise<ChargifySubscription | undefined> {
        try {
            const response = await this.httpClient.get<{ subscription: ChargifySubscription }>(`subscriptions/${id}`);
            return response.subscription;
        } catch (err) {
            if (err.response?.status === 404)
                return undefined;

            throw err;
        }
    }

    public async lookup(reference: string): Promise<ChargifySubscription | undefined> {
        try {
            const response = await this.httpClient.get<{ subscription: ChargifySubscription }>(`subscriptions/lookup`, {
                reference
            });
            return response.subscription;
        } catch (err) {
            if (err.response?.status === 404)
                return undefined;

            throw err;
        }
    }

    public async create(request: CreateSubscriptionRequest): Promise<ChargifySubscription> {
        const response = await this.httpClient.post<{ subscription: ChargifySubscription }>(`subscriptions`, request);
        return response.subscription;
    }

    public async update(id: number, request: UpdateSubscriptionRequest): Promise<ChargifySubscription> {
        const response = await this.httpClient.put<{ subscription: ChargifySubscription }>(`subscriptions/${id}`, request);
        return response.subscription;
    }

    public async changeProduct(id: number, productHandle: string, pricePointHandle: string, delayed: boolean): Promise<ChargifySubscription> {
        const body = {
            product_handle: productHandle,
            product_price_point_handle: pricePointHandle,
            product_changed_delayed: delayed
        };

        const response = await this.httpClient.post<{ subscription: ChargifySubscription }>(`subscriptions/${id}`, body);
        return response.subscription;
    }

    public async cancelProductChange(id: number): Promise<ChargifySubscription> {
        const body = {
            next_product_id: ''
        };

        const response = await this.httpClient.put<{ subscription: ChargifySubscription }>(`subscriptions/${id}`, body);
        return response.subscription;
    }

    public async delayedCancel(id: number, message?: string, reasonCode?: string): Promise<void> {
        const body = {
            cancellation_message: message,
            reason_code: reasonCode
        };

        await this.httpClient.post(`subscriptions/${id}/delayed_cancel`, body);
    }

    public async removeDelayedCancel(id: number): Promise<void> {
        await this.httpClient.delete(`subscriptions/${id}/delayed_cancel`);
    }

    public async changePaymentProfile(id: number, paymentProfileId: number): Promise<void> {
        await this.httpClient.post(`subscriptions/${id}/payment_profiles/${paymentProfileId}/change_payment_profile`);
    }
}