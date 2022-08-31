import { AdminController, Route, Tags, Security, Get, Query, Post, Body, Path, Delete, Put } from '@tcom/platform/lib/api';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ReferralRuleManager, ReferralRule, ReferralEventType, ReferralRuleFilter, NewReferralRule, NewReferralRuleAction, ReferralRuleUpdate, ReferralRuleActionUpdate } from '@tcom/platform/lib/referral';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError } from '@tcom/platform/lib/core';

@Tags('Rules')
@Route('referral/rule')
@Security('admin')
@LogClass()
export class RuleController extends AdminController {
    constructor(@Inject private readonly manager: ReferralRuleManager) {
        super();
    }

    @Get()
    @Security('admin', ['referral:rule:read'])
    public async getAll(
        @Query() enabled?: boolean,
        @Query() groupId?: number,
        @Query() event?: ReferralEventType
    ): Promise<ReferralRule[]> {
        const filter: ReferralRuleFilter = {
            enabled,
            groupId,
            event
        };

        return this.manager.getAll(filter);
    }

    @Get('{id}')
    @Security('admin', ['referral:rule:read'])
    public async get(@Path() id: number): Promise<ReferralRule> {
        const rule = await this.manager.get(id);

        if (!rule)
            throw new NotFoundError('Referral rule not found.');

        return rule;
    }

    @Post()
    @Security('admin', ['referral:rule:write'])
    public async add(@Body() rule: NewReferralRule): Promise<ReferralRule> {
        return this.manager.add(rule);
    }

    @Put('{id}')
    @Security('admin', ['referral:rule:write'])
    public async update(@Path() id: number, @Body() rule: ReferralRuleUpdate): Promise<void> {
        await this.manager.update(id, rule);
    }

    @Delete('{id}')
    @Security('admin', ['referral:rule:delete'])
    public async remove(@Path() id: number): Promise<void> {
        await this.manager.remove(id);
    }

    @Post('{ruleId}/action')
    @Security('admin', ['referral:rule:write'])
    public async addAction(@Path() ruleId: number, @Body() action: NewReferralRuleAction): Promise<ReferralRule> {
        return this.manager.addAction(ruleId, action);
    }

    @Put('action/{id}')
    @Security('admin', ['referral:rule:write'])
    public async updateAction(@Path() id: number, @Body() action: ReferralRuleActionUpdate): Promise<ReferralRule> {
        return this.manager.updateAction(id, action);
    }

    @Delete('action/{id}')
    @Security('admin', ['referral:rule:delete'])
    public async removeAction(@Path() id: number): Promise<ReferralRule> {
        return this.manager.removeAction(id);
    }
}
