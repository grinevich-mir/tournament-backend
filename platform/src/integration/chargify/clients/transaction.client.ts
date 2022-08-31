import { HttpClient } from '../http-client';
import { ChargifyTransaction } from '../interfaces';

export class TransactionClient {
    constructor(private readonly httpClient: HttpClient) {
    }

    public async get(id: number): Promise<ChargifyTransaction | undefined> {
        try {
            const response = await this.httpClient.get<{ transaction: ChargifyTransaction }>(`transactions/${id}`);
            return response.transaction;
        } catch (err) {
            if (err.response?.status === 404)
                return undefined;

            throw err;
        }
    }
}