import { Route, Security, Tags, ClientController, Get, Response, Post, Query, Path, Body } from '@tcom/platform/lib/api';
import { UnauthorizedError } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { Order } from '@tcom/platform/lib/order';
import { EthTransaction } from '@tcom/platform/lib/ethTransaction';
import { StoreItemType } from '@tcom/platform/lib/store/store-item-type';
import { StoreItemLastPurchase } from '@tcom/platform/lib/store/store-item-last-purchase';
import { StoreFilter } from '@tcom/platform/lib/store/store-filter';
import { StoreManager } from '@tcom/platform/lib/store/store-manager';
import { StoreItem } from '@tcom/platform/lib/store/store-item';
import { OrderStoreItemModel,EthOrderModel } from '../models';
import { UserType } from '@tcom/platform/lib/user';

interface StoreItemResponse {
    items: StoreItem[];
    lastPurchases: StoreItemLastPurchase[];
}

@Tags('Store')
@Route('store')
@Security('cognito')
@LogClass()
export class StoreController extends ClientController {
    constructor(
        @Inject private readonly storeManager: StoreManager) {
        super();
    }

    /**
     * @summary Gets the items for the authenticated user
     */
    @Get()
    @Response<UnauthorizedError>(401)
    public async getAll(
        @Query() type?: StoreItemType
    ): Promise<StoreItemResponse> {
        const filter: StoreFilter = {
            level: this.user.level,
            enabled: true,
            public: this.user.type !== UserType.Internal,
            type
        };

        const items = await this.storeManager.getActive(filter);
        const lastPurchases = await this.storeManager.getLastPurchases(this.user.id);

        return {
            items,
            lastPurchases: lastPurchases || []
        };
    }

    /**
     * @summary Gets a item
     */
    @Get('{id}')
    @Response<UnauthorizedError>(401)
    public async get(@Path() id: number) {
        return this.storeManager.get(id);
    }

    /**
     * @summary Order a item
     */
    @Post('order')
    @Response<UnauthorizedError>(401)
    public async order(@Body() params: OrderStoreItemModel): Promise<Order> {
        return this.storeManager.order(this.user.id, params.itemId, params.couponCode);
    }
    /**
     * @summary Order a item
     */
     @Post('orderEth')
     @Response<UnauthorizedError>(401)
     public async orderEth(@Body() params: EthOrderModel): Promise<EthTransaction> {
         return this.storeManager.orderEth(this.user.id, params.itemId, params.couponCode,params.walletAccount);
     }
}
