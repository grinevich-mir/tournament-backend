import { BadRequestError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import Logger, { LogClass } from '../../../core/logging';
import { ChargifyClientFactory, ChargifyCustomer, ChargifyCustomerAttributes, ChargifySubscriptionState } from '../../../integration/chargify';
import { ChargifyClient } from '../../../integration/chargify/chargify-client';
import { User, UserManager } from '../../../user';
import { NewPaymentMethod } from '../../new-payment-method';
import { PaymentInitResult } from '../../payment-init-result';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodInitResult } from '../../payment-method-init-result';
import { PaymentResult } from '../../payment-result';
import { PaymentGateway } from '../payment-gateway';
import { Payment } from '../../payment';
import { ChargifyPaymentMethodMapper } from './chargify-payment-method.mapper';

@Singleton
@LogClass()
export class ChargifyPaymentGateway implements PaymentGateway {
    constructor(
        @Inject private readonly clientFactory: ChargifyClientFactory,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly paymentMethodMapper: ChargifyPaymentMethodMapper) {
    }

    public async createPaymentMethod(user: User, info: NewPaymentMethod): Promise<PaymentMethod> {
        const profile = await this.userManager.getProfile(user.id);

        if (!profile?.email)
            throw new Error('User does not have an email address.');

        const client = await this.clientFactory.create(user.skinId);
        let customer = await client.customers.lookup(user.id.toString());
        const customerUpdate: ChargifyCustomerAttributes = {
            first_name: info.firstName,
            last_name: info.lastName,
            email: profile.email,
            reference: user.id.toString()
        };

        if (!customer)
            customer = await client.customers.create({
                customer: customerUpdate
            });
        else
            customer = await client.customers.update(customer.id, {
                customer: customerUpdate
            });

        const paymentProfile = await client.paymentProfiles.create({
            payment_profile: {
                customer_id: customer.id,
                chargify_token: info.token
            }
        });

        await this.setDefaultPaymentProfile(client, customer, paymentProfile.id);

        const paymentMethod = this.paymentMethodMapper.map(paymentProfile);
        paymentMethod.enabled = true;
        return paymentMethod;
    }

    public async initPaymentMethod(_user: User, _returnUrl?: string): Promise<PaymentMethodInitResult> {
        throw new BadRequestError('Not supported.');
    }

    public async refreshPaymentMethod(_user: User, _paymentMethod: PaymentMethod, _returnUrl?: string): Promise<PaymentMethodInitResult> {
        throw new BadRequestError('Not supported.');
    }

    private async setDefaultPaymentProfile(client: ChargifyClient, customer: ChargifyCustomer, paymentProfileId: number): Promise<void> {
        const subscriptions = await client.customers.getSubscriptions(customer.id);
        const purchasingSubRef = `Purchase:${customer.reference}`;

        const purchasingSub = subscriptions.find(s => s.reference === purchasingSubRef);

        if (!purchasingSub)
            await client.subscriptions.create({
                subscription: {
                    customer_id: customer.id,
                    payment_profile_id: paymentProfileId,
                    product_handle: 'purchase',
                    reference: purchasingSubRef
                }
            });

        if (subscriptions.length === 0)
            return;

        const activeSubscriptions = subscriptions.filter(s => s.state !== ChargifySubscriptionState.Canceled);

        for (const sub of activeSubscriptions)
            try {
                await client.subscriptions.changePaymentProfile(sub.id, paymentProfileId);
            } catch (err) {
                Logger.error(`Failed to change Chargify subscription (${sub.id}) payment profile to ID ${paymentProfileId}`, err);
            }
    }

    public async getCheckoutUrl(user: User, amount: number, currencyCode: string, description: string, reference: string, returnUrl?: string, cancelUrl?: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public async takePayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, reference: string, description?: string, redirectUrl?: string): Promise<PaymentResult> {
        throw new Error('Method not implemented.');
    }

    public async initPayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, description: string, reference: string): Promise<PaymentInitResult> {
        throw new Error('Method not implemented.');
    }

    public async completePayment(user: User, reference: string, data: Record<string, string>): Promise<Payment> {
        throw new Error('Method not implemented.');
    }
}