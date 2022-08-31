import { Route, Security, Tags, ClientController, Get, Response } from '@tcom/platform/lib/api';
import { UnauthorizedError } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentOption, PaymentOptionManager } from '@tcom/platform/lib/payment';
import { UserType } from '@tcom/platform/lib/user';

@Tags('Payment Option')
@Route('payment/option')
@Security('cognito')
@LogClass()
export class PaymentOptionController extends ClientController {
    constructor(
        @Inject private readonly manager: PaymentOptionManager) {
        super();
    }

    /**
     * @summary Gets the payment options available to the user
     */
    @Get()
    @Response<UnauthorizedError>(401)
    public async getAll(): Promise<PaymentOption[]> {
        const country = this.user.regCountry || 'US';
        const currency = this.user.currencyCode || 'USD';

        return this.manager.getAll({
            enabled: true,
            public: this.user.type === UserType.Standard ? true : undefined,
            country,
            currency
        });
    }
}
