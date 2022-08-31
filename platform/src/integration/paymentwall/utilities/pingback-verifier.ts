import { Config, ParameterStore, UnauthorizedError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import Logger, { LogClass } from '../../../core/logging';
import Paymentwall, { Pingback } from 'paymentwall';
import { PaymentwallApiType, PaymentwallPingback } from '../interfaces';

@Singleton
@LogClass()
export class PaymentwallPingbackVerifier {
    constructor(@Inject private readonly parameterStore: ParameterStore) { }

    public async verify(queryString: Record<string, string> | null, ipAddress: string): Promise<PaymentwallPingback> {
        if (!queryString)
            throw new Error('Querystring parameters cannot be empty.');

        const pingback = await this.get(queryString, ipAddress);

        Logger.info('Processing pingback:', pingback);

        if (!pingback.validate())
            throw new UnauthorizedError('Invalid Paymentwall pingback.');

        return {
            uniqueId: pingback.getPingbackUniqueId(),
            referenceId: pingback.getReferenceId(),
            type: pingback.getType(),
            userId: pingback.getUserId(),
            orderId: pingback.getProductId(),
            paymentMethodToken: pingback.getParameter('paymentMethodToken'),
            paymentType: pingback.getParameter('paymentType')
        };
    }

    private async get(parameters: string | object, ipAddress: string): Promise<Pingback> {
        Paymentwall.Configure(
            PaymentwallApiType.DigitalGoods,
            await this.getParameter('app-key', false),
            await this.getParameter('secret-key', true)
        );

        return new Pingback(parameters, ipAddress);
    }

    private async getParameter(name: string, decrypt: boolean = true): Promise<string> {
        return this.parameterStore.get(`/${Config.stage}/integration/paymentwall/${name}`, decrypt, true);
    }
}