import { Get, Route, Tags, Body, Post, Put, Security, AdminController } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NewCurrencyModel, CurrencyRatesModel } from '@tcom/platform/lib/banking/models';
import { Currency, CurrencyManager, CurrencyRate } from '@tcom/platform/lib/banking';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Currencies')
@Route('banking/currency')
@LogClass()
export class CurrencyController extends AdminController {
    constructor(
        @Inject private readonly manager: CurrencyManager) {
        super();
    }

    /**
     * @summary Gets currencies
     * @isInt id
     */
    @Get()
    @Security('admin', ['banking:currency:read'])
    public async getAll(): Promise<Currency[]> {
        return this.manager.getAll();
    }

    /**
     * @summary Creates a new currency
     */
    @Post()
    @Security('admin', ['banking:currency:write'])
    public async add(@Body() currency: NewCurrencyModel): Promise<Currency> {
        return this.manager.add(currency.code, currency.rate);
    }

    /**
     * @summary Gets current currency rates
     */
    @Get('rates')
    @Security('admin', ['banking:currency:read'])
    public async getRates(): Promise<CurrencyRate[]> {
        return this.manager.getRates();
    }

    /**
     * @summary Sets currency rates
     */
    @Put('rates')
    @Security('admin', ['banking:currency:write'])
    public async setRates(@Body() rates: CurrencyRatesModel): Promise<void> {
        for (const code of Object.keys(rates)) {
            if (code === 'USD')
                continue;

            await this.manager.setRate(code, rates[code]);
        }
    }
}