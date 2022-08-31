import { TrustlyEstablishParams, TrustlyPaymentType } from '@tcom/platform/lib/integration/trustly';
import prompts from 'prompts';
import { v4 as uuid } from 'uuid';
import { Context } from '../context';

export async function establish(): Promise<void> {
    const answers = await prompts([
        {
            name: 'userId',
            type: 'number',
            message: 'User ID'
        },
        {
            name: 'customerName',
            type: 'text',
            message: 'Customer Name',
            validate: value => value?.length === 0 ? 'Required' : true
        },
        {
            name: 'currency',
            type: 'text',
            message: 'Currency',
            initial: 'USD'
        },
        {
            name: 'amount',
            type: 'number',
            float: true,
            message: 'Amount'
        },
        {
            name: 'paymentType',
            type: 'select',
            choices: [
                { title: 'Instant', value: TrustlyPaymentType.Instant, selected: true },
                { title: 'Disbursement', value: TrustlyPaymentType.Disbursement },
                { title: 'Deferred', value: TrustlyPaymentType.Deferred }
            ],
            initial: 0,
            message: 'Payment Type'
        },
        {
            name: 'description',
            type: 'text',
            message: 'Description'
        },
        {
            name: 'merchantReference',
            type: 'text',
            message: 'Reference'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const params: TrustlyEstablishParams = {
        amount: answers.amount.toFixed(2),
        currency: answers.currency,
        paymentType: answers.paymentType,
        description: answers.description,
        merchantId: Context.merchantId,
        merchantReference: answers.merchantReference || uuid(),
        returnUrl: 'https://dev.tournament.com',
        cancelUrl: 'https://dev.tournament.com',
        customer: {
            externalId: answers.userId.toString(),
            name: answers.customerName,
            taxId: '00000000'
        }
    };

    console.log();
    console.log(`Sending request:`, params);
    console.log();
    const startTime = Date.now();
    const response = await Context.client.transaction.establish(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}