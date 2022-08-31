import { Config, ForbiddenError, generateId, NotFoundError, ParameterStore } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { TrustlyClientFactory, TrustlyPaymentType } from '../../../integration/trustly';
import { TrustlyRequestSigner } from '../../../integration/trustly/utilities';
import { User, UserManager } from '../../../user';
import { NewPaymentMethod } from '../../new-payment-method';
import { PaymentInitResult } from '../../payment-init-result';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodInitResult } from '../../payment-method-init-result';
import { PaymentProvider } from '../../payment-provider';
import { PaymentResult } from '../../payment-result';
import { PaymentStatus } from '../../payment-status';
import { PaymentGateway } from '../payment-gateway';
import { Payment } from '../../payment';
import { TrustlyErrorMapper } from './trustly-error.mapper';

@Singleton
@LogClass()
export class TrustlyPaymentGateway implements PaymentGateway {
    constructor(
        @Inject private readonly clientFactory: TrustlyClientFactory,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly requestSigner: TrustlyRequestSigner,
        @Inject private readonly errorMapper: TrustlyErrorMapper) {
    }

    public async createPaymentMethod(_user: User, _info: NewPaymentMethod): Promise<PaymentMethod> {
        throw new Error('Not supported.');
    }

    public async initPaymentMethod(user: User, data?: any): Promise<PaymentMethodInitResult> {
        const profile = await this.userManager.getProfile(user.id);

        if (!profile)
            throw new NotFoundError('User not found.');

        const accessId = await this.parameterStore.get(`/${Config.stage}/integration/trustly/access-id`, false, true);
        const merchantId = await this.parameterStore.get(`/${Config.stage}/integration/trustly/merchant-id`, false, true);
        const customerName = profile.forename && profile.surname ? `${profile.forename} ${profile.surname}` : user.displayName;

        const result: any = {
            accessId,
            amount: '0.00',
            currency: user.currencyCode || 'USD',
            merchantId,
            customer: {
                externalId: user.id.toString(),
                name: customerName,
                email: profile.email || undefined
            },
            merchantReference: generateId(),
            paymentType: 'Deferred',
            returnUrl: data.returnUrl,
            cancelUrl: data.cancelUrl
        };

        const requestSignature = await this.requestSigner.sign(result);

        return {
            provider: PaymentProvider.Trustly,
            data: {
                ...result,
                requestSignature
            }
        };
    }

    public async refreshPaymentMethod(user: User, paymentMethod: PaymentMethod, returnUrl?: string): Promise<PaymentMethodInitResult> {
        if (paymentMethod.provider !== PaymentProvider.Trustly)
            throw new ForbiddenError('Payment method is not for Trustly');

        const profile = await this.userManager.getProfile(user.id);

        if (!profile)
            throw new NotFoundError('User not found.');

        const accessId = await this.parameterStore.get(`/${Config.stage}/integration/trustly/access-id`, false, true);
        const merchantId = await this.parameterStore.get(`/${Config.stage}/integration/trustly/merchant-id`, false, true);
        const customerName = profile.forename && profile.surname ? `${profile.forename} ${profile.surname}` : user.displayName;

        const result: any = {
            accessId,
            amount: '0.00',
            currency: user.currencyCode || 'USD',
            merchantId,
            customer: {
                externalId: user.id.toString(),
                name: customerName,
                email: profile.email || undefined
            },
            merchantReference: generateId(),
            paymentType: 'Verification',
            authToken: 'new',
            transactionId: paymentMethod.providerRef,
            returnUrl,
            cancelUrl: returnUrl
        };

        const requestSignature = await this.requestSigner.sign(result);

        return {
            provider: PaymentProvider.Trustly,
            data: {
                ...result,
                requestSignature
            }
        };
    }

    public async getCheckoutUrl(user: User, amount: number, currencyCode: string, description: string, reference: string, returnUrl?: string, cancelUrl?: string): Promise<string> {
        const client = await this.clientFactory.create();
        const merchantId = await this.parameterStore.get(`/${Config.stage}/integration/trustly/merchant-id`, false, true);

        const profile = await this.userManager.getProfile(user.id);

        if (!profile)
            throw new NotFoundError('User not found.');

        const customerName = profile.forename && profile.surname ? `${profile.forename} ${profile.surname}` : user.displayName;

        const response = await client.transaction.establish({
            merchantId,
            currency: currencyCode,
            amount: amount.toFixed(2),
            paymentType: TrustlyPaymentType.Instant,
            returnUrl: returnUrl || '',
            cancelUrl: cancelUrl || returnUrl || '',
            customer: {
                externalId: user.id.toString(),
                name: customerName,
                email: profile.email || undefined
            },
            description,
            merchantReference: reference
        });

        return response.url;
    }

    public async takePayment(_user: User, paymentMethod: PaymentMethod, amount: number, _currencyCode: string, reference: string, _description?: string, _redirectUrl?: string): Promise<PaymentResult> {
        const client = await this.clientFactory.create();
        const splitToken = paymentMethod.metadata?.splitToken as string;

        try {
            await client.transaction.capture(paymentMethod.providerRef, {
                amount: amount.toFixed(2),
                merchantReference: reference,
                splitToken
            });
        } catch (err) {
            throw this.errorMapper.map(err);
        }

        return {
            provider: PaymentProvider.Trustly,
            status: PaymentStatus.Pending
        };
    }

    public async initPayment(_user: User, _paymentMethod: PaymentMethod, _amount: number, _currencyCode: string, _description: string, _reference: string): Promise<PaymentInitResult> {
        throw new Error('Method not implemented.');
    }

    public async completePayment(user: User, reference: string, data: Record<string, string>): Promise<Payment> {
        throw new Error('Method not implemented.');
    }
}