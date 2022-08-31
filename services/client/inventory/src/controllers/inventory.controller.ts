import { Get, Post, Query, Response, Route, Security, SuccessResponse, Tags, ClientController } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { InventoryFilter, InventoryGetAllFilter, InventoryManager } from '@tcom/platform/lib/inventory';
import { NotFoundError, UnauthorizedError } from '@tcom/platform/lib/core/errors';
import { InventoryModelMapper, InventoryItemModel } from '@tcom/platform/lib/inventory/models';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PagedResult } from '@tcom/platform/lib/core';
import { InventoryCountModel } from '../models';

@Tags('Inventory')
@Route('inventory')
@Security('cognito')
@LogClass()
export class InventoryController extends ClientController {
    constructor(
        @Inject private readonly inventoryManager: InventoryManager,
        @Inject private readonly mapper: InventoryModelMapper) {
        super();
    }

    /**
     * @summary Gets the available inventory for the authenticated user
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    @Response<UnauthorizedError>(401)
    public async getAll(@Query() claimed?: boolean,
                        @Query() expired?: boolean,
                        @Query() page: number = 1,
                        @Query() pageSize: number = 20): Promise<PagedResult<InventoryItemModel>> {
        const userId = this.user.id;
        const filter: InventoryGetAllFilter = {
            userId,
            claimed,
            expired,
            enabled: true,
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        const result = await this.inventoryManager.getAll(filter);
        const models = this.mapper.mapAll(result.items);
        return new PagedResult(models, result.totalCount, result.page, result.pageSize);
    }

    /**
     * @summary Count available unclaimed inventory items
     */
    @Get('count')
    @Response<UnauthorizedError>(401)
    public async count(): Promise<InventoryCountModel> {
        const filter: InventoryFilter = {
            userId: this.user.id,
            claimed: false,
            expired: false,
            enabled: true
        };

        const count = await this.inventoryManager.count(filter);

        return {
            count
        };
    }

    /**
     * @summary Gets an inventory for the authenticated user by ID
     * @isInt id ID must be an integer
     */
    @Get('{id}')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404, 'Inventory item not found')
    public async get(id: number): Promise<InventoryItemModel> {
        const userId = this.user.id;
        const item = await this.inventoryManager.get(id);

        if (!item || item.userId !== userId || !item.enabled)
            throw new NotFoundError('Inventory item not found');

        return this.mapper.map(item);
    }

    /**
     * @summary Claims an inventory item
     * @isInt id ID must be an integer
     */
    @Post('{id}/claim')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404, 'Inventory item not found')
    public async claim(id: number): Promise<void> {
        await this.inventoryManager.claimForUser(id, this.user.id);
        this.setStatus(200);
    }
}
