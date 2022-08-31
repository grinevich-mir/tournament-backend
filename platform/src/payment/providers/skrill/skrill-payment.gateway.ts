
import { NotFoundError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { User, UserManager } from '../../../user';
import { NewPaymentMethod } from '../../new-payment-method';
import { PaymentInitResult } from '../../payment-init-result';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodInitResult } from '../../payment-method-init-result';
import { PaymentResult } from '../../payment-result';
import { PaymentGateway } from '../payment-gateway';
import { SkrillClientFactory, SkrillPrepareCheckoutParams } from '../../../integration/skrill';
import { SkinManager } from '../../../skin';
import { Payment } from '../../payment';
import moment from 'moment';

@Singleton
@LogClass()
export class SkrillPaymentGateway implements PaymentGateway {
    constructor(
        @Inject private readonly clientFactory: SkrillClientFactory,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly skinManager: SkinManager) {
    }

    public async createPaymentMethod(user: User, info: NewPaymentMethod): Promise<PaymentMethod> {
        throw new Error('Method not implemented.');
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

        const skin = await this.skinManager.get(user.skinId);

        if (!skin)
            throw new NotFoundError(`Skin not found for user ${user.id}.`);

        const client = await this.clientFactory.create();
        const params: SkrillPrepareCheckoutParams = {
            amount,
            currency: currencyCode,
            transaction_id: reference,
            detail1_description: 'Description:',
            detail1_text: description,
            recipient_description: skin.name,
            logo_url: `https://${skin.domain}/img/${skin.name.toLowerCase()}-logo-square.png`,
            return_url: returnUrl,
            return_url_text: `Return to ${skin.name}`,
            cancel_url: cancelUrl || returnUrl,
            pay_from_email: profile.email,
            firstname: profile.forename,
            lastname: profile.surname,
            address: profile.address?.line1,
            address2: profile.address?.line2,
            city: profile.address?.city,
            state: profile.address?.state,
            country: profile.address?.country,
            postal_code: profile.address?.zipCode
        };

        if (profile.dob)
            params.date_of_birth = moment(profile.dob).format('ddmmyyyy');

        return client.checkout.prepare(params);
    }

    public async initPayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, description: string, reference: string): Promise<PaymentInitResult> {
        throw new Error('Method not implemented.');
    }

    public async takePayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, reference: string, description?: string, redirectUrl?: string): Promise<PaymentResult> {
        throw new Error('Method not implemented.');
    }

    public async completePayment(user: User, reference: string, data: Record<string, string>): Promise<Payment> {
        throw new Error('Method not implemented.');
    }
}