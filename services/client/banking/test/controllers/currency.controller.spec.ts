import { describe, it } from '@tcom/test';
import { mock, when, instance, deepEqual, verify, reset } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { CurrencyManager, Currency, CurrencyFilter } from '@tcom/platform/lib/banking';
import { CurrencyController } from '../../src/controllers/currency.controller';

const testData = [
    {
        countryCode: 'US',
        currencyCode: 'USD'
    },
    {
        countryCode: 'CA',
        currencyCode: 'CAD'
    }
];

const supportedCurrencies: Currency[] = [
    {
        code: 'USD',
        userSelectable: true,
        enabled: true
    },
    {
        code: 'CAD',
        userSelectable: true,
        enabled: true
    }
];

describe('CurrencyController', () => {
    const mockCurrencyManager = mock(CurrencyManager);

    function getController(): CurrencyController {
        return new CurrencyController(instance(mockCurrencyManager));
    }

    beforeEach(() => {
        reset(mockCurrencyManager);
    });

    describe('getAll()', () => {
        const currencyFilter: CurrencyFilter = {
            enabled: true,
            userSelectable: true
        };

        testData.forEach(data => {
            it(`${data.countryCode} should return currencies with ${data.currencyCode} default`, async () => {
                // Given
                const countryCode = data.countryCode;

                when(mockCurrencyManager.getAll(deepEqual(currencyFilter))).thenResolve(supportedCurrencies);

                const controller = getController();

                // When
                const result = await controller.getAll(countryCode);

                // Then
                expect(result.default).to.equal(data.currencyCode);
                expect(result.currencies[0]).to.equal('USD');
                expect(result.currencies[1]).to.equal('CAD');
                verify(mockCurrencyManager.getAll(deepEqual(currencyFilter))).once();
            });
        });

        it('RO should return currencies with USD default', async () => {
            // Given
            const countryCode = 'RO';

            when(mockCurrencyManager.getAll(deepEqual(currencyFilter))).thenResolve(supportedCurrencies);

            const controller = getController();

            // When
            const result = await controller.getAll(countryCode);

            // Then
            expect(result.default).to.equal('USD');
            expect(result.currencies[0]).to.equal('USD');
            expect(result.currencies[1]).to.equal('CAD');
            verify(mockCurrencyManager.getAll(deepEqual(currencyFilter))).once();
        });

        it('XX should return currencies with USD default', async () => {
            // Given
            const countryCode = 'XX';

            when(mockCurrencyManager.getAll(deepEqual(currencyFilter))).thenResolve(supportedCurrencies);

            const controller = getController();

            // When
            const result = await controller.getAll(countryCode);

            // Then
            expect(result.default).to.equal('USD');
            expect(result.currencies[0]).to.equal('USD');
            expect(result.currencies[1]).to.equal('CAD');
            verify(mockCurrencyManager.getAll(deepEqual(currencyFilter))).once();
        });
    });
});