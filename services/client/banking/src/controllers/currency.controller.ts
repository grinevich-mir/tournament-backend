import { Get, Route, Tags, Path, ClientController } from '@tcom/platform/lib/api';
import { CurrencyListModel } from '../models';
import { getAllInfoByISO } from 'iso-country-currency';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { CurrencyManager } from '@tcom/platform/lib/banking';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Currency')
@Route('banking/currency')
@LogClass()
export class CurrencyController extends ClientController {
    constructor(
        @Inject private readonly manager: CurrencyManager) {
            super();
        }

    /**
     * @summary Gets all supported currencies and the default currency for the supplied country code.
     */
    @Get('{countryCode}')
    public async getAll(@Path() countryCode: string): Promise<CurrencyListModel> {
        const currencies = await this.manager.getAll({
            enabled: true,
            userSelectable: true
        });

        let defaultCurrencyCode = this.getCountryCurrency(countryCode);
        const supportedCurrency = currencies.find(c => c.code === defaultCurrencyCode);

        if (!supportedCurrency)
            defaultCurrencyCode = 'USD';

        return {
            default: defaultCurrencyCode,
            currencies: currencies.map(c => c.code)
        };
    }

    private getCountryCurrency(countryCode: string): string {
        try {
            const countryInfo = getAllInfoByISO(countryCode);
            return countryInfo.currency;
        } catch {
            return 'USD';
        }
    }
}
