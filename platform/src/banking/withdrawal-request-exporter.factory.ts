import { IocContainer, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { PayPalWithdrawalRequestExporter } from './providers/paypal';
import { WithdrawalProvider } from './withdrawal-provider';
import { WithdrawalRequestExporter } from './withdrawal-request-exporter';

@Singleton
@LogClass()
export class WithdrawalRequestExporterFactory {
    public create(provider: WithdrawalProvider): WithdrawalRequestExporter {
        switch (provider) {
            case WithdrawalProvider.PayPal:
                return IocContainer.get(PayPalWithdrawalRequestExporter);
        }

        throw new Error(`Withdrawal request provider '${provider}' is not supported.`);
    }
}