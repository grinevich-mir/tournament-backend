import { describe, it } from '@tcom/test';
import { mock, when, instance, verify, reset } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { Currency, CurrencyManager, CurrencyRate } from '@tcom/platform/lib/banking';
import { CurrencyController } from '../../src/controllers/currency.controller';
import { CurrencyRatesModel, NewCurrencyModel } from '@tcom/platform/lib/banking/models';

describe('CurrencyController', () => {
    const mockCurrencyManager = mock(CurrencyManager);

    function getController(): CurrencyController {
        return new CurrencyController(instance(mockCurrencyManager));
    }

    beforeEach(() => reset(mockCurrencyManager));

    describe('getAll()', () => {
        const testData: Currency[] = [
            {
                code: 'USD',
                userSelectable: true,
                enabled: true
            },
            {
                code: 'CAD',
                userSelectable: true,
                enabled: true
            },
            {
                code: 'DIA',
                userSelectable: false,
                enabled: true
            }
        ];

        it('should return the available currencies', async () => {
            // Given
            when(mockCurrencyManager.getAll()).thenResolve(testData);

            const controller = getController();

            // When
            const result = await controller.getAll();

            // Then
            expect(result[0].code).to.equal('USD');
            expect(result[1].userSelectable).to.equal(true);
            verify(mockCurrencyManager.getAll()).once();
        });
    });

    describe('add()', () => {
        const currencyModel: NewCurrencyModel = {
            code: 'EUR',
            rate: 1,
        };

        const newCurrency: Currency = {
            code: 'EUR',
            userSelectable: true,
            enabled: true,
        };

        it('should add a new currency', async () => {
            // Given
            when(mockCurrencyManager.add(currencyModel.code, currencyModel.rate)).thenResolve(newCurrency);

            const controller = getController();

            // When
            const result = await controller.add(currencyModel);

            // Then
            expect(result.code).to.equal('EUR');
            expect(result.userSelectable).to.equal(true);
            expect(result.enabled).to.equal(true);
            verify(mockCurrencyManager.add(currencyModel.code, currencyModel.rate)).once();
        });
    });

    describe('getRates()', () => {
        const currencyRate: CurrencyRate[] = [{
            currencyCode: 'USD',
            rate: 2,
            createTime: new Date(),
            updateTime: new Date(),
        }];

        it('should return current currency rates', async () => {
            // Given
            when(mockCurrencyManager.getRates()).thenResolve(currencyRate);

            const controller = getController();

            // When
            const result = await controller.getRates();

            // Then
            expect(result[0]).to.equal(currencyRate[0]);
            verify(mockCurrencyManager.getRates()).once();
        });
    });

    describe('setRates()', () => {
        const rates: CurrencyRatesModel = {
            GBP: 1.5543,
            DIA: 0.1,
            USD: 1,
        };

        it('should set currency rates', async () => {
            // Given
            when(mockCurrencyManager.setRate('DIA', 0.1)).thenResolve();

            const controller = getController();

            // When
            await controller.setRates(rates);

            // Then
            verify(mockCurrencyManager.setRate('GBP', 1.5543)).once();
            verify(mockCurrencyManager.setRate('DIA', 0.1)).once();
            verify(mockCurrencyManager.setRate('USD', 1)).never();
        });
    });
});