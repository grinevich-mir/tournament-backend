import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { CRMRecipient, CRMSender, CRMTemplateName } from '@tcom/platform/lib/crm';
import { CreditCardPaymentMethod, PaymentMethodManager, PaymentMethodType } from '@tcom/platform/lib/payment';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { UserNotificationType } from '@tcom/platform/lib/user';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
export class OnExpiredCardHandler {
    constructor(
        @Inject private readonly crmSender: CRMSender,
        @Inject private readonly paymentMethodManager: PaymentMethodManager) {
    }

    public async execute() {
        const enabledExpiredCards = await this.processEnabledExpiredCards();
        if (enabledExpiredCards.length === 0)
            return;

        await this.sendMessage(enabledExpiredCards);
    }

    private async processEnabledExpiredCards(): Promise<CRMRecipient[]> {
        const expiredCards = await this.paymentMethodManager.getAll({ expired: true });

        if (expiredCards.items.length > 0)
            await Promise.all(expiredCards.items.map((c) => this.paymentMethodManager.disable(c.id)));

        const expiredItems = expiredCards.items.filter(t => t.type = PaymentMethodType.CreditCard) as CreditCardPaymentMethod[];
        const recipients: CRMRecipient[] = expiredItems.map((e) => ({
            userId: e.userId,
            data: {
                CardType: e.cardType,
                LastFour: e.lastFour,
            }
        }));

        return recipients;
    }

    private async sendMessage(recipients: CRMRecipient[]): Promise<void> {
        await this.crmSender.sendAll(recipients, UserNotificationType.Account, CRMTemplateName.PaymentCardExpired);
    }
}

export const onExpiredCard = lambdaHandler(() => IocContainer.get(OnExpiredCardHandler).execute());