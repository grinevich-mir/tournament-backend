import { NotFoundError, PagedResult } from '../core';
import { PlatformEventDispatcher } from '../core/events';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { UserManager } from '../user';
import { PaymentMethodCreatedEvent } from './events';
import { PaymentMethodCache } from './cache';
import { NewPaymentMethod } from './new-payment-method';
import { PaymentMethod } from './payment-method';
import { PaymentMethodFilter } from './payment-method-filter';
import { PaymentMethodInitResult } from './payment-method-init-result';
import { PaymentProvider } from './payment-provider';
import { PaymentGatewayFactory } from './providers';
import { PaymentMethodRepository } from './repositories';

@Singleton
@LogClass()
export class PaymentMethodManager {
    constructor(
        @Inject private readonly cache: PaymentMethodCache,
        @Inject private readonly repository: PaymentMethodRepository,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly gatewayFactory: PaymentGatewayFactory,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
    }

    public async getAll(filter?: PaymentMethodFilter): Promise<PagedResult<PaymentMethod>> {
        return this.repository.getAll(filter);
    }

    public async get(id: number): Promise<PaymentMethod | undefined> {
        return this.repository.get(id);
    }

    public async getByProviderRef(provider: PaymentProvider, providerRef: string): Promise<PaymentMethod | undefined> {
        return this.repository.getByProviderRef(provider, providerRef);
    }

    public async getActiveForUser(userId: number): Promise<PaymentMethod | undefined> {
        const cached = await this.cache.getActiveForUser(userId);

        if (cached)
            return cached;

        const paymentMethod = await this.repository.getActiveForUser(userId);

        if (!paymentMethod)
            return undefined;

        await this.cache.storeActiveForUser(paymentMethod);
        return paymentMethod;
    }

    public async create(userId: number, provider: PaymentProvider, info: NewPaymentMethod): Promise<PaymentMethod> {
        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        const gateway = this.gatewayFactory.create(provider);

        const paymentMethod = await gateway.createPaymentMethod(user, info);
        paymentMethod.userId = user.id;

        const created = await this.repository.add(paymentMethod);

        await this.userManager.setHasPaymentMethod(userId, true);
        await this.storeActive(paymentMethod);

        await this.eventDispatcher.send(new PaymentMethodCreatedEvent(created));

        return created;
    }

    public async init(userId: number, provider: PaymentProvider, returnUrl?: string): Promise<PaymentMethodInitResult> {
        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        const gateway = this.gatewayFactory.create(provider);
        return gateway.initPaymentMethod(user, returnUrl);
    }

    public async refresh(userId: number, id: number, returnUrl?: string): Promise<PaymentMethodInitResult> {
        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        const method = await this.get(id);

        if (!method || method.userId !== userId)
            throw new NotFoundError('Payment method not found.');

        const gateway = this.gatewayFactory.create(method.provider);
        return gateway.refreshPaymentMethod(user, method, returnUrl);
    }

    public async add(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
        const created = await this.repository.add(paymentMethod);
        await this.storeActive(created);
        return created;
    }

    public async disable(id: number): Promise<void>;
    public async disable(paymentMethod: PaymentMethod): Promise<void>;
    public async disable(idOrPaymentMethod: number | PaymentMethod): Promise<void> {
        const method = typeof idOrPaymentMethod === 'number' ? await this.get(idOrPaymentMethod) : idOrPaymentMethod;

        if (!method)
            return;

        if (!method.enabled)
            return;

        await this.repository.disable(method.id);
        await this.cache.removeActiveForUser(method);
        await this.userManager.setHasPaymentMethod(method.userId, false);
    }

    public async getForExpiration(expiresIn: number): Promise<PaymentMethod[]> {
        return this.repository.getForExpiration(expiresIn);
    }

    public async storeActive(paymentMethod: PaymentMethod): Promise<void> {
        if (!paymentMethod.enabled)
            return;

        await this.cache.storeActiveForUser(paymentMethod);
    }
}
