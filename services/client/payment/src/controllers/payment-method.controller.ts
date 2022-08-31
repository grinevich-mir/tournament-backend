import { Route, Security, Tags, ClientController, Get, Response, Post, Body, Path } from '@tcom/platform/lib/api';
import { NotFoundError, UnauthorizedError } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NewPaymentMethod, PaymentMethodInitResult, PaymentMethodManager, PaymentProvider } from '@tcom/platform/lib/payment';
import { UserManager, UserProfileUpdate } from '@tcom/platform/lib/user';
import { PaymentMethodModel, PaymentMethodModelMapper } from '@tcom/platform/lib/payment/models';
import { PaymentMethodInitParamsModel, PaymentMethodRefreshParamsModel } from '../models';

@Tags('Payment Method')
@Route('payment/method')
@Security('cognito')
@LogClass()
export class PaymentMethodController extends ClientController {
    constructor(
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly paymentMethodMapper: PaymentMethodModelMapper,
        @Inject private readonly userManager: UserManager) {
        super();
    }

    /**
     * @summary Gets the payment method for the authenticated user
     */
    @Get()
    @Response<UnauthorizedError>(401)
    public async get(): Promise<PaymentMethodModel> {
        const paymentMethod = await this.paymentMethodManager.getActiveForUser(this.user.id);

        if (!paymentMethod)
            throw new NotFoundError('Payment method not found.');

        return this.paymentMethodMapper.map(paymentMethod);
    }

    /**
     * @summary Creates a payment method and sets it as the default for the authenticated user
     */
    @Post()
    @Response<UnauthorizedError>(401)
    public async add(@Body() info: NewPaymentMethod): Promise<PaymentMethodModel> {
        const paymentMethod = await this.paymentMethodManager.create(this.user.id, PaymentProvider.Chargify, info);

        const profileUpdate: UserProfileUpdate = {
            forename: info.firstName,
            surname: info.lastName
        };

        await this.userManager.setProfile(this.user.id, profileUpdate);
        return this.paymentMethodMapper.map(paymentMethod);
    }

    /**
     * @summary Initialises payment method creation
     */
     @Post('init')
     @Response<UnauthorizedError>(401)
     public async init(@Body() params: PaymentMethodInitParamsModel): Promise<PaymentMethodInitResult> {
        return this.paymentMethodManager.init(this.user.id, params.provider, params.returnUrl);
     }

    /**
     * @summary Initialises payment method refresh
     */
    @Post('{id}/refresh')
    @Response<UnauthorizedError>(401)
    public async refresh(@Path() id: number, @Body() params: PaymentMethodRefreshParamsModel): Promise<PaymentMethodInitResult> {
        return this.paymentMethodManager.refresh(this.user.id, id, params.returnUrl);
    }
}
