import { Config, ParameterStore, NotFoundError, ForbiddenError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { User, UserManager } from '../../../user';
import { NewPaymentMethod } from '../../new-payment-method';
import { PaymentInitResult } from '../../payment-init-result';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodInitResult } from '../../payment-method-init-result';
import { PaymentResult } from '../../payment-result';
import { PaymentGateway } from '../payment-gateway';
import { PaymentProvider } from '../../payment-provider';
import { Payment } from '../../payment';
import { PaymentMethodCache } from '../../cache';
import { PaymentMethodRepository } from '../../repositories';
import { PaymentwallClientFactory, PaymentwallProductType, PaymentwallTransaction } from '../../../integration/paymentwall';
import { PaymentwallPaymentProcessor } from './utilities';
import { PaymentwallPaymentMethodMapper } from './mappers';
import moment from 'moment';
import uuid from 'uuid';

@Singleton
@LogClass()
export class PaymentwallPaymentGateway implements PaymentGateway {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly clientFactory: PaymentwallClientFactory,
        @Inject private readonly paymentProcessor: PaymentwallPaymentProcessor,
        @Inject private readonly paymentMethodCache: PaymentMethodCache,
        @Inject private readonly paymentMethodRepository: PaymentMethodRepository,
        @Inject private readonly paymentMethodMapper: PaymentwallPaymentMethodMapper) {
    }

    public async createPaymentMethod(user: User, info: NewPaymentMethod): Promise<PaymentMethod> {
        const mapped = this.paymentMethodMapper.map(info.token, user.id, true);
        const added = await this.paymentMethodRepository.add(mapped);

        await this.paymentMethodCache.storeActiveForUser(added);

        return added;
    }

    public async initPaymentMethod(user: User, returnUrl?: string): Promise<PaymentMethodInitResult> {
        throw new Error('Method not implemented.');
    }

    public async refreshPaymentMethod(user: User, paymentMethod: PaymentMethod, data?: any): Promise<PaymentMethodInitResult> {
        throw new Error('Method not implemented.');
    }

    public async getCheckoutUrl(user: User, amount: number, currencyCode: string, description: string, reference: string, returnUrl?: string, cancelUrl?: string): Promise<string> {
        const profile = await this.userManager.getProfile(user.id);

        if (!profile)
            throw new NotFoundError('User not found.');

        if (!profile.email)
            throw new ForbiddenError('User email has not been set.');

        const paymentMethod = await this.paymentMethodRepository.getActiveForUser(user.id, PaymentProvider.Paymentwall);
        const widgetCode = await this.parameterStore.get(`/${Config.stage}/integration/paymentwall/widget-code`, false, true);
        const client = await this.clientFactory.create();

        return client.widget.getUrl(
            user.id.toString(),
            widgetCode,
            [
                {
                    id: reference,
                    amount,
                    currencyCode,
                    name: description,
                    type: PaymentwallProductType.Fixed
                }
            ],
            {
                email: profile.email,
                merchant_order_id: reference,
                success_url: returnUrl || '',
                paymentMethodToken: paymentMethod ? paymentMethod.providerRef : uuid(),
                ps: 'all',
                'history[registration_date]': moment(user.createTime).unix()
            }
        );
    }

    public async initPayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, description: string, reference: string): Promise<PaymentInitResult> {
        throw new Error('Method not implemented.');
    }

    public async takePayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, reference: string, description?: string, redirectUrl?: string): Promise<PaymentResult> {
        throw new Error('Method not implemented.');
    }

    public async completePayment(user: User, reference: string, data: Record<string, string>): Promise<Payment> {
        const referenceId = data.referenceId;
        const paymentType = data.paymentType;
        const paymentMethodToken = data.paymentMethodToken;

        if (!referenceId)
            throw new ForbiddenError('Paymentwall payment ref not supplied.');

        if (!paymentType)
            throw new ForbiddenError('Paymentwall payment type not supplied.');

        if (!paymentMethodToken)
            throw new ForbiddenError('Paymentwall payment method token not supplied.');

        const client = await this.clientFactory.create();
        const payment = await client.payment.get(referenceId);

        if (!payment)
            throw new NotFoundError(`Paymentwall payment '${referenceId}' not found.`);

        const transaction: PaymentwallTransaction = {
            paymentType,
            paymentMethodToken,
            ...payment
        };

        return this.paymentProcessor.process(transaction, user);
    }
}