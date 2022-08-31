
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { WithdrawalRequest } from '../../withdrawal-request';
import { WithdrawalRequestExporter } from '../../withdrawal-request-exporter';
import { WithdrawalProvider } from '../../withdrawal-provider';
import { WithdrawalRequestExportResult } from '../../withdrawal-request-export-result';
import { Parser } from 'json2csv';

@Singleton
@LogClass()
export class PayPalWithdrawalRequestExporter implements WithdrawalRequestExporter {
    public export(requests: WithdrawalRequest[]): WithdrawalRequestExportResult {
        if (requests.length === 0)
            throw new Error('Withdrawal requests not supplied');

        if (requests.length >= 5000)
            throw new Error('Too many withdrawal requests. Maximum is 5,000');

        if (requests.some((request: WithdrawalRequest) => request.provider !== WithdrawalProvider.PayPal))
            throw new Error('Supplied withdrawal requests contain invalid provider');

        const parser = new Parser({ header: false, quote: '' });
        const fields = requests.map((request: WithdrawalRequest) => {
            return {
                'Recipient Identifier': request.providerRef,
                'Payment Amount': request.amount,
                'Currency Code': request.currencyCode,
                'Customer ID': request.userId,
                'Note to Recipient': '',
                'Recipient Wallet': 'PAYPAL'
            };
        });

        return {
            fileName: `PayPal_Withdrawals_${new Date().toISOString()}.csv`,
            data: parser.parse(fields)
        };
    }
}