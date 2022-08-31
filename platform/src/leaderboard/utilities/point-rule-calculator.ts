import { LeaderboardPointConfigEventRule } from '../leaderboard-point-config';
import { Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class PointRuleCalculator {
    public calculate(rule: LeaderboardPointConfigEventRule, eventCount: number, input?: number): number {
        let points = 0;

        if (typeof rule.points === 'number')
            points = rule.points;
        else if (input)
            points = input;

        if (rule.multiplier !== undefined)
            if (typeof rule.multiplier === 'number')
                points = points * rule.multiplier;
            else if (rule.multiplier === 'count')
                points = points * eventCount;

        return points;
    }
}