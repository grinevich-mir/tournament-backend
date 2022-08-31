import { Singleton } from '../../core/ioc';
import { LeaderboardPointConfigEventRule } from '../leaderboard-point-config';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class PointRuleMatcher {
    public match(rules: LeaderboardPointConfigEventRule[], eventCount: number, input?: number): LeaderboardPointConfigEventRule | undefined {
        if (!rules || rules.length === 0)
            throw new Error('No rules supplied to match on.');

        const reversedRules = rules.slice().reverse();
        return reversedRules.find(r => this.isMatch(r, eventCount, input));
    }

    private isMatch(rule: LeaderboardPointConfigEventRule, eventCount: number, input?: number): boolean {
        if (rule.count === undefined)
            return true;

        return rule.count === eventCount;
    }
}