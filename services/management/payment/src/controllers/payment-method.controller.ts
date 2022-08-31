import { AdminController, Route, Tags, Security, Put, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentMethodManager } from '@tcom/platform/lib/payment';

@Tags('Payment Method')
@Route('payment/method')
@LogClass()
export class PaymentMethodController extends AdminController {
    constructor(@Inject private readonly paymentMethodManager: PaymentMethodManager) {
        super();
    }

    @Put('{userId}/disable')
    @Security('admin', ['payment:method:write'])
    public async disable(@Path() userId: number): Promise<void> {
        const method = await this.paymentMethodManager.getActiveForUser(userId);

        if (!method)
            return;

        await this.paymentMethodManager.disable(method.id);
    }
}