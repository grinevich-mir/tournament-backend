import _ from 'lodash';
import { CouponManager } from '../coupon';
import { BadRequestError, ForbiddenError, GeneralError, NotFoundError, PagedResult } from '../core';
import { PlatformEventDispatcher } from '../core/events';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { Websocket } from '../websocket';
import { EthTransactionCreatedEvent} from './events';
import {  EthTransaction,NewEthTransaction } from './ethTransaction';

import {EthTransactionRepository  } from './repositories/ethTransaction.repository';


@Singleton
@LogClass()
export class EthTransactionManager {
    constructor(
        @Inject private readonly repository: EthTransactionRepository,
        @Inject private readonly couponManager: CouponManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher,
        @Inject private readonly websocket: Websocket) {
    }

    // public async getAll(filter?: OrderFilter): Promise<PagedResult<EthTransaction>> {
    //     return this.repository.getAll(filter);
    // }

    public async get(id: number): Promise<EthTransaction | undefined> {
        return this.repository.get(id);
    }

    public async add(order: NewEthTransaction): Promise<EthTransaction> {
       // order = await this.applyCoupon(order);
        const added = await this.repository.add(order);
        await this.eventDispatcher.send(new EthTransactionCreatedEvent(added.id));
        return added;
    }

    // public async remove(id: number): Promise<void> {
    //     const order = await this.get(id);

    //     if (!order)
    //         throw new NotFoundError('Order not found.');

    //     if (![OrderStatus.Pending, OrderStatus.Expired].includes(order.status))
    //         throw new ForbiddenError(`Order is ${order.status} and cannot be removed.`);

    //     await this.repository.remove(id);
    // }

    // public async setStatus(id: number, status: OrderStatus): Promise<void> {
    //     const order = await this.repository.get(id);

    //     if (!order)
    //         throw new NotFoundError('Order not found.');

    //     if (order.status === status)
    //         return;

    //     await this.repository.setStatus(id, status);
    //     await this.eventDispatcher.send(new OrderStatusChangedEvent(id, order.status, status));

    //     if (status === OrderStatus.Complete)
    //         await this.websocket.send({
    //             type: 'User',
    //             userId: order.userId
    //         }, 'Order:Complete', {
    //             orderId: order.id
    //         });
    // }

    // public async addPayment(id: number, payment: Payment): Promise<void>;
    // public async addPayment(order: Order, payment: Payment): Promise<void>;
    // public async addPayment(idOrOrder: number | Order, payment: Payment): Promise<void> {
    //     const order = typeof idOrOrder === 'number' ? await this.get(idOrOrder) : idOrOrder;

    //     if (!order)
    //         throw new NotFoundError('Order not found.');

    //     if (order.payments.find(p => p.id === payment.id))
    //         return;

    //     await this.repository.addPayment(order.id, payment.id);

    //     order.payments.push(payment);

    //     if (payment.status !== PaymentStatus.Declined)
    //         return;

    //     await this.eventDispatcher.send(new OrderPaymentFailedEvent(order.id, payment));

    //     await this.websocket.send({
    //         type: 'User',
    //         userId: order.userId
    //     }, 'Order:PaymentFailed', {
    //         orderId: order.id,
    //         paymentId: payment.id,
    //         paymentMethodId: payment.paymentMethodId,
    //         provider: payment.provider,
    //         errorCode: payment.errorCode
    //     });
    // }

    // public async setItemProcessed(itemId: number, processed: boolean): Promise<void> {
    //     await this.repository.setItemProcessed(itemId, processed);
    // }

    // public async expire(maxAgeMins: number): Promise<void> {
    //     const orders = await this.repository.getForExpiration(maxAgeMins);

    //     if (orders.length === 0)
    //         return;

    //     await this.repository.setStatuses(orders.map(o => o.id), OrderStatus.Expired);
    //     const events = orders.map(o => new OrderStatusChangedEvent(o.id, o.status, OrderStatus.Expired));
    //     await this.eventDispatcher.send(...events);
    // }

    // public async applyCoupon(order: NewOrder): Promise<NewOrder> {
    //     if (!order.couponCode)
    //         return order;

    //     const coupon = await this.couponManager.getActive(order.couponCode);

    //     if (!coupon)
    //         throw new GeneralError('Coupon not found');

    //     const priceTotal = _.sumBy(order.items, i => i.price);

    //     if (coupon.restrictions)
    //         if (coupon.restrictions.minPurchase && priceTotal < coupon.restrictions.minPurchase)
    //             throw new BadRequestError('Coupon minimum purchase not reached');

    //     if (coupon.bonusItems)
    //         coupon.bonusItems.forEach(item => order.items.push({
    //             type: OrderItemType.Diamonds,
    //             quantity: item.quantity,
    //             description: item.description,
    //             price: item.price
    //         }));

    //     if (coupon.amountOff)
    //         order.couponTotal = coupon.amountOff;

    //     if (coupon.percentOff)
    //         order.couponTotal = priceTotal * (coupon.percentOff / 100);

    //     return order;
    // }

    // public async getTotalPaid(id: number): Promise<number>;
    // public async getTotalPaid(order: Order): Promise<number>;
    // public async getTotalPaid(idOrOrder: number | Order): Promise<number> {
    //     const order = typeof idOrOrder === 'number' ? await this.get(idOrOrder) : idOrOrder;

    //     if (!order)
    //         throw new NotFoundError('Order not found.');

    //     const payments = order.payments.filter(p => p.status === PaymentStatus.Successful);

    //     if (!payments || payments.length === 0)
    //         return 0;

    //     return _.sumBy(payments, p => p.amount);
    // }
}