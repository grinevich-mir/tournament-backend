import { SkrillPrepareCheckoutParams } from '@tcom/platform/lib/integration/skrill';
import { Context } from '../context';
import prompts from 'prompts';
import { v4 as uuid } from 'uuid';

export async function prepare(): Promise<void> {
    const answers = await prompts([
        {
            name: 'transactionId',
            type: 'text',
            message: 'Transaction ID',
            initial: uuid()
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
            message: 'Amount',
            initial: 10
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const params: SkrillPrepareCheckoutParams = {
        transaction_id: answers.transactionId,
        amount: answers.amount,
        currency: answers.currency
    };

    console.log();
    console.log(`Sending request:`, params);
    console.log();
    const startTime = Date.now();
    const response = await Context.client.checkout.prepare(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}