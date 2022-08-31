import { AdminController, Post, Route, Tags, Body, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { InventoryManager, NewInventoryItem, InventoryItem } from '@tcom/platform/lib/inventory';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Inventory')
@Route('inventory')
@Security('admin', ['inventory:write'])
@LogClass()
export class InventoryController extends AdminController {
    constructor(
        @Inject private readonly manager: InventoryManager) {
        super();
    }

    /**
     * @summary Add new item to users inventory
     */
    @Post()
    public async add(@Body() item: NewInventoryItem): Promise<InventoryItem> {
        return this.manager.add(item);
    }
}
