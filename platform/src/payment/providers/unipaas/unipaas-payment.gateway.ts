import { BadRequestError, ForbiddenError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { UnipaasClientFactory, UnipaasCheckoutParams, UnipaasAddress } from '../../../integration/unipaas';
import { User, UserManager, UserProfile } from '../../../user';
import { NewPaymentMethod } from '../../new-payment-method';
import { PaymentInitResult } from '../../payment-init-result';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodInitResult } from '../../payment-method-init-result';
import { PaymentMethodType } from '../../payment-method-type';
import { PaymentProvider } from '../../payment-provider';
import { PaymentResult } from '../../payment-result';
import { PaymentActionType } from '../../payment-action';
import { PaymentGateway } from '../payment-gateway';
import { Payment } from '../../payment';
import { UnipaasPaymentMapper } from './unipaas-payment.mapper';

@Singleton
@LogClass()
export class UnipaasPaymentGateway implements PaymentGateway {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly clientFactory: UnipaasClientFactory,
        @Inject private readonly mapper: UnipaasPaymentMapper) {
    }

    public async createPaymentMethod(_user: User, _info: NewPaymentMethod): Promise<PaymentMethod> {
        throw new BadRequestError('Not supported.');
    }

    public initPaymentMethod(_user: User, _data?: any): Promise<PaymentMethodInitResult> {
        throw new BadRequestError('Not supported.');
    }

    public refreshPaymentMethod(_user: User, _paymentMethod: PaymentMethod, _returnUrl?: string): Promise<PaymentMethodInitResult> {
        throw new BadRequestError('Not supported.');
    }

    public async getCheckoutUrl(user: User, amount: number, currencyCode: string, description: string, reference: string, returnUrl?: string, cancelUrl?: string): Promise<string> {
        const country = user.regCountry || 'US';

        if (!country)
            throw new ForbiddenError('Could not determine user country.');

        if (!user.currencyCode)
            throw new ForbiddenError('User currency code has not been set.');

        const profile = await this.userManager.getProfile(user.id);

        if (!profile)
            throw new Error('User profile does not exist.');

        if (!profile.email)
            throw new ForbiddenError('User email has not been set.');

        const client = await this.clientFactory.create();

        const request: UnipaasCheckoutParams = {
            reference,
            amount,
            country,
            currency: currencyCode,
            description,
            email: profile.email,
            orderId: reference,
            successfulPaymentRedirect: returnUrl,
            billingAddress: this.mapAddress(profile),
            shippingSameAsBilling: true
        };

        const response = await client.payIn.checkout(request);

        return response.shortLink;
    }

    public async takePayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, reference: string, description?: string, redirectUrl?: string): Promise<PaymentResult> {
        const country = user.regCountry || 'US';

        if (!country)
            throw new ForbiddenError('Could not determine user country.');

        if (!user.currencyCode)
            throw new ForbiddenError('User currency code has not been set.');

        const profile = await this.userManager.getProfile(user.id);

        if (!profile)
            throw new Error('User profile does not exist.');

        if (!profile.email)
            throw new ForbiddenError('User email has not been set.');

        if (paymentMethod.provider !== PaymentProvider.Unipaas)
            throw new ForbiddenError('Payment method does not belong to Unipaas.');

        const client = await this.clientFactory.create();

        const authorizeResult = await client.payIn.authorize({
            orderId: reference,
            amount,
            currency: currencyCode,
            consumer: {
                firstName: profile.forename || '',
                lastName: profile.surname || '',
                email: profile.email,
                country
            },
            paymentOptionId: paymentMethod.providerRef,
            urls: {
                redirectUrl
            }
        });

        const result: PaymentResult = {
            provider: PaymentProvider.Unipaas,
            status: this.mapper.mapStatus(authorizeResult.authorizationStatus)
        };

        if (authorizeResult.redirectUrl)
            result.action = {
                type: PaymentActionType.Redirect,
                url: authorizeResult.redirectUrl,
                popup: paymentMethod.type === PaymentMethodType.PayPal
            };

        return result;
    }

    public async initPayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, description: string, reference: string): Promise<PaymentInitResult> {
        const country = user.regCountry || 'US';

        if (!country)
            throw new ForbiddenError('Could not determine user country.');

        if (!user.currencyCode)
            throw new ForbiddenError('User currency code has not been set.');

        const profile = await this.userManager.getProfile(user.id);

        if (!profile)
            throw new Error('User profile does not exist.');

        if (!profile.email)
            throw new ForbiddenError('User email has not been set.');

        const consumerId = String(paymentMethod.metadata?.consumerId);

        if (!consumerId)
            throw new ForbiddenError('Invalid payment method.');

        const client = await this.clientFactory.create();

        const response = await client.payIn.checkout({
            reference,
            consumerId,
            amount,
            country,
            currency: currencyCode,
            description,
            email: profile.email,
            orderId: reference,
            billingAddress: this.mapAddress(profile),
            shippingSameAsBilling: true
        });

        return {
            provider: PaymentProvider.Unipaas,
            data: {
                paymentOptionId: paymentMethod.providerRef,
                sessionToken: response.sessionToken
            }
        };
    }

    public async completePayment(user: User, reference: string, data: Record<string, string>): Promise<Payment> {
        throw new Error('Method not implemented.');
    }

    private mapAddress(profile: UserProfile): UnipaasAddress | undefined {
        const address = profile.address;

        if (!address)
            return;

        const stateCountries = ['US', 'CA', 'IN'];
        let state = '';

        if (address.state && stateCountries.includes(address.country) && address.state.length === 2)
            state = address.state;

        return {
            firstName: profile.forename,
            lastName: profile.surname,
            line1: address.line1,
            line2: address.line2 && address.line3 ? `${address.line2}, ${address.line3}` :  address.line2,
            city: address.city,
            state,
            postalCode: address.zipCode,
            country: address.country
        };
    }
}