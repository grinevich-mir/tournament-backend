import { Singleton, Inject } from '../core/ioc';
import { StoreItemRepository } from './repositories';
import { BadRequestError, ForbiddenError, NotFoundError, PagedResult } from '../core';
import { StoreFilter, StoreGetAllFilter } from './store-filter';
import { LogClass } from '../core/logging';
import { NewStoreItem } from './new-store-item';
import { StoreItem } from './store-item';
import { Order, OrderItemType, OrderManager } from '../order';
import {EthTransaction, EthTransactionManager} from '../ethTransaction'
import { UserManager, UserType } from '../user';
import { StoreItemType } from './store-item-type';
import { StoreCache } from './cache';
import { StoreItemLastPurchase } from './store-item-last-purchase';
import { StoreItemUpdate } from './store-item-update';
import _ from 'lodash';

@Singleton
@LogClass()
export class StoreManager {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly repository: StoreItemRepository,
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly transacManager: EthTransactionManager,
        @Inject private readonly storeCache: StoreCache) {
    }

    public async getActive(filter?: StoreFilter): Promise<StoreItem[]> {
        const cachedItems = await this.storeCache.getAll();

        if (cachedItems)
            return this.filter(cachedItems, filter);

        const result = await this.repository.getAll({
            enabled: true
        });

        await this.storeCache.store(...result.items);
        return this.filter(result.items, filter);
    }

    public async getAll(filter?: StoreGetAllFilter): Promise<PagedResult<StoreItem>> {
        return this.repository.getAll(filter);
    }

    public async get(id: number): Promise<StoreItem> {
        const cachedStoreItem = await this.storeCache.get(id);
        if (cachedStoreItem)
            return cachedStoreItem;

        const item = await this.repository.get(id);

        if (!item)
            throw new NotFoundError('Store item not found');

        await this.storeCache.store(item);
        return item;
    }

    public async add(newItem: NewStoreItem): Promise<StoreItem> {
        const item = await this.repository.add(newItem);

        if (newItem.enabled)
            await this.storeCache.store(item);

        return item;
    }

    public async update(id: number, update: StoreItemUpdate): Promise<StoreItem> {
        const item = await this.repository.update(id, update);

        if (item.enabled)
            await this.storeCache.store(item);
        else
            await this.storeCache.remove(item.id);

        return item;
    }

    public async enable(id: number): Promise<void> {
        await this.repository.enable(id);
        const item = await this.get(id);

        if (item) {
            item.enabled = true;
            await this.storeCache.store(item);
        }
    }

    public async disable(id: number): Promise<void> {
        await this.repository.disable(id);
        await this.storeCache.remove(id);
    }

    public async order(userId: number, itemId: number, couponCode?: string): Promise<Order> {
        const item = await this.get(itemId);

        if (!item)
            throw new NotFoundError('Store item not found.');

        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        if (!item.enabled || user.level < item.minLevel || user.level > item.maxLevel)
            throw new ForbiddenError('Store item not available.');

        if (!item.public && user.type !== UserType.Internal)
            throw new ForbiddenError('Store item not available.');

        await this.storeCache.storeLastPurchase(userId, item.type, item.quantity);

        return this.orderManager.add({
            userId: user.id,
            description: item.name,
            currencyCode: user.currencyCode || 'USD',
            couponCode,
            items: [{
                type: this.mapOrderItemType(item.type),
                description: item.name,
                quantity: item.quantity,
                price: item.price
            }]
        });
    }

    public async orderEth(userId: number, itemId: number, couponCode?: string, walletAccount: string): Promise<EthTransaction> {
        const item = await this.get(itemId);

        if (!item)
            throw new NotFoundError('Store item not found.');

        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        if (!item.enabled || user.level < item.minLevel || user.level > item.maxLevel)
            throw new ForbiddenError('Store item not available.');

        if (!item.public && user.type !== UserType.Internal)
            throw new ForbiddenError('Store item not available.');

        await this.storeCache.storeLastPurchase(userId, item.type, item.quantity);

        const or= await this.orderManager.add({
            userId: user.id,
            description: item.name,
            currencyCode: 'ETH',
            couponCode,
            items: [{
                type: this.mapOrderItemType(item.type),
                description: item.name,
                quantity: item.quantity,
                price: item.price
            }]
        });
       return this.transacManager.add({
        completeTime: new Date(),
        orderId:or.id.toString(),
        transectionId:'',
        accountId:walletAccount,
        userId:userId,
        transactionAmount:'',
        status:0,
        TransactionStatus:'',
        TotalAmount:'',
        TransactionDateTime:'',
        TransactionResponseJson:'',
        UserRequestJson:'',
        transactionLogId:''
    });
         
    }
    public async getLastPurchases(userId: number): Promise<StoreItemLastPurchase[] | false> {
        return this.storeCache.getLastPurchases(userId);
    }

    private mapOrderItemType(itemType: StoreItemType): OrderItemType {
        switch (itemType) {
            case StoreItemType.Diamonds:
                return OrderItemType.Diamonds;
            default:
                throw new BadRequestError('Unknown item type');
        }
    }

    private filter(items: StoreItem[], filter?: StoreFilter): StoreItem[] {
        if (!filter)
            return items;

        return _.chain(items)
            .filter(item => !filter.type || filter.type === item.type)
            .filter(item => filter.enabled === undefined || filter.enabled === item.enabled)
            .filter(item => filter.public === undefined || filter.public === item.public)
            .filter(item => filter.level === undefined || (filter.level >= item.minLevel && filter.level <= item.maxLevel))
            .sortBy(item => item.priority || 0, item => item.createTime)
            .reverse()
            .value();
    }
}