import { AdminController, Route, Tags, Security, Get, Path, Put, Body, Post } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { Jackpot, JackpotManager, JackpotType, JackpotUpdate } from '@tcom/platform/lib/jackpot';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { JackpotAdjustmentModel } from '../models';
import { JackpotUpdateModel } from '../models/jackpot-update.model';

@Tags('Jackpots')
@Route('jackpot')
@LogClass()
export class JackpotController extends AdminController {
    constructor(
        @Inject private readonly manager: JackpotManager) {
        super();
    }

    /**
     * @summary Gets all jackpots
     */
    @Get()
    @Security('admin', ['jackpot:read'])
    public async getAll(): Promise<Jackpot[]> {
        return this.manager.getAll();
    }

    /**
     * @summary Gets a jackpot
     */
    @Get('{id}')
    @Security('admin', ['jackpot:read'])
    public async get(@Path() id: number): Promise<Jackpot> {
        const jackpot = await this.manager.get(id);

        if (!jackpot)
            throw new NotFoundError('Jackpot not found.');

        return jackpot;
    }

    /**
     * @summary Updates a jackpot
     */
    @Put('{id}')
    @Security('admin', ['jackpot:write'])
    public async update(@Path() id: number, @Body() model: JackpotUpdateModel): Promise<Jackpot> {
        const jackpot = await this.manager.get(id);

        if (!jackpot)
            throw new NotFoundError('Jackpot not found.');

        let update: JackpotUpdate;

        switch (jackpot.type) {
            case JackpotType.Fixed:
                update = {
                    type: JackpotType.Fixed,
                    label: model.label,
                    name: model.name,
                    seed: model.seed,
                    splitPayout: model.splitPayout
                };
                break;

            case JackpotType.Progressive:
                update = {
                    type: JackpotType.Progressive,
                    label: model.label,
                    name: model.name,
                    seed: model.seed,
                    splitPayout: model.splitPayout,
                    contributionGroup: model.contributionGroup,
                    contributionMultiplier: model.contributionMultiplier,
                    maxBalance: (model.maxBalance as number),
                    maxContribution: (model.maxContribution as number)
                };
                break;

            default:
                throw new Error(`Jackpot type ${jackpot.type} is not supported.`);
        }

        return this.manager.update(id, update);
    }

    /**
     * @summary Enables a jackpot
     */
    @Put('{id}/enable')
    @Security('admin', ['jackpot:write'])
    public async enable(@Path() id: number): Promise<void> {
        await this.manager.setEnabled(id, true);
    }

    /**
     * @summary Disables a jackpot
     */
    @Put('{id}/disable')
    @Security('admin', ['jackpot:write'])
    public async disable(@Path() id: number): Promise<void> {
        await this.manager.setEnabled(id, false);
    }

    /**
     * @summary Adds an adjustment to a jackpot
     */
    @Post('{id}/adjustment')
    @Security('admin', ['jackpot:write'])
    public async adjust(@Path() id: number, @Body() adjustment: JackpotAdjustmentModel): Promise<number> {
        const source = `Employee:${this.user.id}`;
        return this.manager.adjust(id, adjustment.amount, adjustment.purpose, source);
    }

    /**
     * @summary Resets a jackpot (seeds it if one is set up)
     */
    @Post('{id}/reset')
    @Security('admin', ['jackpot:write'])
    public async reset(@Path() id: number): Promise<number> {
        const source = `Employee:${this.user.id}`;
        return this.manager.reset(id, source);
    }
}
