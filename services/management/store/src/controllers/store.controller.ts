import { AdminController, Get, Route, Tags, Query, Security, Path, Post, Body, Put } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PagedResult } from '@tcom/platform/lib/core';
import { StoreItem, StoreItemType, StoreManager, NewStoreItem, StoreGetAllFilter, StoreItemUpdate } from '@tcom/platform/lib/store';

@Tags('Store')
@Route('store')
@LogClass()
export class StoreController extends AdminController {
    constructor(
        @Inject private readonly storeManager: StoreManager) {
        super();
    }

    /**
     * @summary Get all items
     */
    @Get()
    @Security('admin', ['store:read'])
    public async getAll(
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() level?: number,
        @Query('public') isPublic?: boolean,
        @Query() enabled?: boolean,
        @Query() type?: StoreItemType
    ): Promise<PagedResult<StoreItem>> {
        const filter: StoreGetAllFilter = {
            level,
            type,
            page,
            pageSize,
            public: isPublic,
            enabled,
            order: {
                createTime: 'DESC'
            }
        };

        return this.storeManager.getAll(filter);
    }

    /**
     * @summary Get single item
     */
    @Get('{id}')
    @Security('admin', ['store:read'])
    public async get(@Path() id: number): Promise<StoreItem> {
        return this.storeManager.get(id);
    }

    /**
     * @summary Add an item
     */
    @Post()
    @Security('admin', ['store:write'])
    public async add(@Body() item: NewStoreItem): Promise<StoreItem> {
        return this.storeManager.add(item);
    }

    /**
     * @summary Update an item
     */
    @Put('{id}')
    @Security('admin', ['store:write'])
    public async update(id: number, @Body() item: StoreItemUpdate): Promise<StoreItem> {
        return this.storeManager.update(id, item);
    }

    /**
     * @summary Enable a item
     */
    @Put('{id}/enable')
    @Security('admin', ['store:write'])
    public async enable(@Path() id: number): Promise<void> {
        return this.storeManager.enable(id);
    }

    /**
     * @summary Disable a item
     */
    @Put('{id}/disable')
    @Security('admin', ['store:write'])
    public async disable(@Path() id: number): Promise<void> {
        return this.storeManager.disable(id);
    }
}
