import { HttpClient } from '../http-client';
import { ChargifyProductPricePoint } from '../interfaces';

export class ProductClient {
    constructor(private readonly httpClient: HttpClient) {
    }

    public async getPricePoint(productId: number, pricePointId: number): Promise<ChargifyProductPricePoint | undefined> {
        try {
            const response = await this.httpClient.get<{ price_point: ChargifyProductPricePoint }>(`products/${productId}/price_points/${pricePointId}`);
            return response.price_point;
        } catch (err) {
            if (err.response?.status === 404)
                return undefined;

            throw err;
        }
    }

    public async getPricePoints(productId: number): Promise<ChargifyProductPricePoint[]> {
        const response = await this.httpClient.get<{ price_points: ChargifyProductPricePoint }[]>(`products/${productId}/price_points`);
        return response.map(r => r.price_points);
    }
}