import { HttpClient } from '../http-client';
import { ChargifyPaymentProfile, CreatePaymentProfileRequest, ListPaymentProfilesParameters, UpdatePaymentProfileRequest } from '../interfaces';

export class PaymentProfileClient {
    constructor(private readonly httpClient: HttpClient) {
    }

    public async get(id: number): Promise<ChargifyPaymentProfile | undefined> {
        try {
            const response = await this.httpClient.get<{ payment_profile: ChargifyPaymentProfile }>(`payment_profiles/${id}`);
            return response.payment_profile;
        } catch (err) {
            if (err.response?.status === 404)
                return undefined;

            throw err;
        }
    }

    public async list(params?: ListPaymentProfilesParameters): Promise<ChargifyPaymentProfile[]> {
        const response = await this.httpClient.get<{ payment_profile: ChargifyPaymentProfile }[]>(`payment_profiles`, params as any);
        return response.map(r => r.payment_profile);
    }

    public async create(request: CreatePaymentProfileRequest): Promise<ChargifyPaymentProfile> {
        const response = await this.httpClient.post<{ payment_profile: ChargifyPaymentProfile }>(`payment_profiles`, request);
        return response.payment_profile;
    }

    public async update(id: number, request: UpdatePaymentProfileRequest): Promise<ChargifyPaymentProfile> {
        const response = await this.httpClient.put<{ payment_profile: ChargifyPaymentProfile }>(`payment_profiles/${id}`, request);
        return response.payment_profile;
    }
}