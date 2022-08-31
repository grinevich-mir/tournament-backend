import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMRecipient, CRMSender, CRMTemplateName } from '@tcom/platform/lib/crm';
import { CreditCardPaymentMethod, PaymentMethodManager } from '@tcom/platform/lib/payment';
import { UserNotificationType } from '@tcom/platform/lib/user';
import { lambdaHandler } from '@tcom/platform/lib/core';

const intervals: number[] = [14, 7, 2];
@Singleton
@LogClass()
export class OnExpiringCardHandler {
    constructor(
        @Inject private readonly crmSender: CRMSender,
        @Inject private readonly paymentMethodManager: PaymentMethodManager) { }

    public async execute(): Promise<void> {
        for (const interval of intervals) {
            const recipients = await this.processEnabledExpiringCards(interval);
            if (recipients.length === 0)
                continue;

            await this.sendMessages(recipients);
        }
    }

    private async processEnabledExpiringCards(expiresIn: number): Promise<CRMRecipient[]> {
        const expiringCards = await this.paymentMethodManager.getForExpiration(expiresIn);

        const expiredItems = expiringCards as CreditCardPaymentMethod[];

        const recipients: CRMRecipient[] = expiredItems.map((e) => ({
            userId: e.userId,
            data: {
                CardType: e.cardType,
                LastFour: e.lastFour,
                ExpiringMonth: e.expiryMonth,
                ExpiringYear: e.expiryYear,
                ExpiresIn: expiresIn,
            }
        }));

        return recipients;
    }

    private async sendMessages(recipients: CRMRecipient[]): Promise<void> {
        await this.crmSender.sendAll(recipients, UserNotificationType.Account, CRMTemplateName.PaymentCardExpiring);
    }

}

export const onExpiringCard = lambdaHandler(() => IocContainer.get(OnExpiringCardHandler).execute());