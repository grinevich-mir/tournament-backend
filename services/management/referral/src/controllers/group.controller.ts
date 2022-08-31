import { AdminController, Route, Tags, Security, Get, Path, Post, Body, Delete, Put } from '@tcom/platform/lib/api';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ReferralGroupManager, ReferralGroup, NewReferralGroup, ReferralGroupUpdate } from '@tcom/platform/lib/referral';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError } from '@tcom/platform/lib/core';
import { SetDefaultGroupModel } from '../models';

@Tags('Groups')
@Route('referral/group')
@Security('admin')
@LogClass()
export class GroupController extends AdminController {
    constructor(@Inject private readonly manager: ReferralGroupManager) {
        super();
    }

    @Get()
    @Security('admin', ['referral:group:read'])
    public async getAll(): Promise<ReferralGroup[]> {
        return this.manager.getAll();
    }

    @Post()
    @Security('admin', ['referral:group:write'])
    public async add(@Body() group: NewReferralGroup): Promise<ReferralGroup> {
        return this.manager.add(group.name);
    }

    @Get('{id}')
    @Security('admin', ['referral:group:read'])
    public async get(@Path() id: number): Promise<ReferralGroup> {
        const group = await this.manager.get(id);

        if (!group)
            throw new NotFoundError('Referral group not found.');

        return group;
    }

    @Put('default')
    @Security('admin', ['referral:group:write'])
    public async setDefault(@Body() model: SetDefaultGroupModel): Promise<void> {
        await this.manager.setDefault(model.id);
    }

    @Put('{id}')
    @Security('admin', ['referral:group:write'])
    public async update(@Path() id: number, @Body() group: ReferralGroupUpdate): Promise<ReferralGroup> {
        return this.manager.update(id, group);
    }

    @Delete('{id}')
    @Security('admin', ['referral:group:delete'])
    public async remove(@Path() id: number): Promise<void> {
        await this.manager.remove(id);
    }
}
