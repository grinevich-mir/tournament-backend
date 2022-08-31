import { toMoney } from '../banking/utilities';
import { Inject, Singleton } from '../core/ioc';
import Logger, { LogClass } from '../core/logging';
import { ProgressiveJackpot } from './jackpot';
import { JackpotAdjustmentPurpose } from './jackpot-adjustment-purpose';
import { JackpotManager } from './jackpot-manager';
import { JackpotType } from './jackpot-type';

@Singleton
@LogClass()
export class JackpotContributor {
    constructor(@Inject private readonly manager: JackpotManager) {
    }

    public async contribute(groups: string[], amount: number, source: string): Promise<void> {
        const jackpots = await this.manager.getAll({
            type: JackpotType.Progressive,
            enabled: true
        }) as ProgressiveJackpot[];

        if (jackpots.length === 0)
            return;

        const validJackpots = jackpots.filter(j => groups.includes(j.contributionGroup));

        for (const jackpot of validJackpots)
            await this.process(jackpot, amount, source);
    }

    private async process(jackpot: ProgressiveJackpot, amount: number, source: string): Promise<void> {
        const multiplier = jackpot.contributionMultiplier;
        let contribution = toMoney(amount, 'USD').multiply(multiplier).toUnit();

        if (contribution === 0)
            return;

        if (jackpot.maxContribution)
            contribution = Math.min(jackpot.maxContribution, contribution);

        Logger.info(`Adding ${contribution} USD to '${jackpot.name}' (${jackpot.id}).`, {
            amount,
            multiplier,
            maxContribution: jackpot.maxContribution
        });

        await this.manager.adjust(jackpot.id, contribution, JackpotAdjustmentPurpose.Contribution, source);
    }
}