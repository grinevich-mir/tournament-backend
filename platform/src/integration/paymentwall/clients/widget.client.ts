import { Widget } from 'paymentwall';
import { PaymentwallProduct } from '../interfaces';
import { PaymentwallProductMapper } from '../mappers';

export class WidgetClient {
    private readonly mapper = new PaymentwallProductMapper();

    public async getUrl(
        userId: string,
        widgetCode: string,
        products?: PaymentwallProduct[],
        extraParams?: Record<string, string | number>): Promise<string> {
        const widget = new Widget(userId, widgetCode, products?.map(p => this.mapper.map(p)), extraParams);
        return widget.getUrl();
    }
}