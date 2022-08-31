import moment from 'moment';
import _ from 'lodash';
import { Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';

export const MAX_VALUE = 2147483647;

@Singleton
@LogClass()
export class PointsFormatter {
    public format(points: number, tieBreaker: number): string {
        if (points && !Number.isInteger(points))
            throw new Error('Points value must be an integer.');

        const suffix = _.padStart((tieBreaker).toString(), 10, '0');
        return `${points}.${suffix}`;
    }

    public getTieBreaker(tieBreaker?: Date | number): number {
        if (tieBreaker instanceof Date || tieBreaker === undefined) {
            const timestamp = tieBreaker ? moment(tieBreaker).utc().unix() : moment.utc().unix();
            tieBreaker = timestamp;
        }
        return MAX_VALUE - tieBreaker;
    }

    public parse(value: string): [number, number] {
        const roundedPoints = Number(value).toFixed(10);
        const points = Math.trunc(Number(roundedPoints));
        const tieBreakerStr = roundedPoints.split('.')[1] || '0';
        const tieBreaker = Number(_.padEnd(tieBreakerStr, 10, '0'));
        return [points, tieBreaker];
    }
}