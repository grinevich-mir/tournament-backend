import { Inject, Singleton } from '../../../core/ioc';
import Logger, { LogClass } from '../../../core/logging';
import { GameBonus } from '../../game-bonus';
import { GameBonusInvalidator } from '../game-bonus-invalidator';
import axios from 'axios';
import { Config, ParameterStore } from '../../../core';

@Singleton
@LogClass()
export class RevolverGameBonusInvalidator implements GameBonusInvalidator {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async invalidate(bonus: GameBonus): Promise<void> {
        const host = await this.parameterStore.get(`/${Config.stage}/integration/revolver/backoffice/api-host`, false, true);
        const apiKey = await this.parameterStore.get(`/${Config.stage}/integration/revolver/backoffice/api-key`, true, true);

        const body = {
            roundId: bonus.providerRef,
            key: apiKey
        };

        const url = `https://${host}/api/exposed/bonus/invalidate`;
        Logger.info(`Invalidating Revolver bonus with Round ID ${bonus.providerRef}`);
        await axios.post(url, body);
    }
}