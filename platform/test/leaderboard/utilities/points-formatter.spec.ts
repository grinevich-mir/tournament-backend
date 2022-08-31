import { describe, it } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { PointsFormatter, MAX_VALUE } from '@tcom/platform/lib/leaderboard/utilities/points-formatter';
import moment from 'moment';
import _ from 'lodash';

describe('PointsFormatter', () => {
    describe('getTieBreaker()', () => {
        it('should return tie breaker using timestamp if no tiebreaker supplied', () => {
            // Given
            const timestamp = moment().utc().unix();
            const expectedTieBreaker = MAX_VALUE - timestamp;

            const formatter = new PointsFormatter();

            // When
            const result = formatter.getTieBreaker();

            // Then
            expect(result).to.equal(expectedTieBreaker);
        });

        it('should return tie breaker using date if supplied', () => {
            // Given
            const date = moment.utc('2020-08-11 12:32:43').toDate();
            const expectedTieBreaker = 550334484;

            const formatter = new PointsFormatter();

            // When
            const result = formatter.getTieBreaker(date);

            // Then
            expect(result).to.equal(expectedTieBreaker);
        });

        it('should return tie breaker using supplied value if supplied', () => {
            // Given
            const tieBreaker = 9547;
            const expectedTieBreaker = 2147474100;

            const formatter = new PointsFormatter();

            // When
            const result = formatter.getTieBreaker(tieBreaker);
            // Then
            expect(result).to.equal(expectedTieBreaker);
        });
    });

    describe('format()', () => {
        it('should return formatted points using timestamp if no tiebreaker supplied', () => {
            // Given
            const points = 1234;
            const timestamp = moment().utc().unix();
            const expectedTieBreaker = _.padStart(( MAX_VALUE - timestamp).toString(), 10, '0');

            const formatter = new PointsFormatter();
            const tieBreaker = formatter.getTieBreaker();

            // When
            const result = formatter.format(points, tieBreaker);

            // Then
            expect(result).to.equal(`${points}.${expectedTieBreaker}`);
        });

        it('should return formatted points using date if supplied', () => {
            // Given
            const points = 1234;
            const tieBreaker = 548866528;

            const formatter = new PointsFormatter();

            // When
            const result = formatter.format(points, tieBreaker);

            // Then
            expect(result).to.equal(`1234.0548866528`);
        });

        it('should return formatted points using supplied value if supplied', () => {
            // Given
            const points = 1234;
            const tieBreaker = 2147474100;
            const expectedValue = `1234.2147474100`;

            const formatter = new PointsFormatter();

            // When
            const result = formatter.format(points, tieBreaker);

            // Then
            expect(result).to.equal(expectedValue);
        });
    });

    describe('parse()', () => {
        it('should return points and tie breaker that used timestamp', () => {
            // Given
            const rawPoints = `1234.0548866528`;
            const expectedPoints = 1234;
            const expectedTieBreaker = 548866528;
            const formatter = new PointsFormatter();

            // When
            const [points, tieBreaker] = formatter.parse(rawPoints);

            // Then
            expect(points).to.equal(expectedPoints);
            expect(tieBreaker).to.equal(expectedTieBreaker);
        });

        it('should return points and tie breaker', () => {
            // Given
            const rawPoints = `2.214747718999999`;
            const expectedPoints = 2;
            const expectedTieBreaker = 2147477190;
            const formatter = new PointsFormatter();

            // When
            const [points, tieBreaker] = formatter.parse(rawPoints);

            // Then
            expect(points).to.equal(expectedPoints);
            expect(tieBreaker).to.equal(expectedTieBreaker);
        });
    });
});