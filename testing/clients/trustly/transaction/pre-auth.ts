import { TrustlyTransactionPreAuthParams } from '@tcom/platform/lib/integration/trustly';
import prompts from 'prompts';
import { v4 as uuid } from 'uuid';
import { Context } from '../context';

export async function preAuth(): Promise<void> {
    const answers = await prompts([
        {
            name: 'transactionId',
            type: 'number',
            message: 'Transaction ID'
        },
        {
            name: 'amount',
            type: 'number',
            float: true,
            message: 'Amount'
        },
        {
            name: 'merchantReference',
            type: 'text',
            message: 'Reference'
        },
        {
            name: 'splitToken',
            type: 'text',
            message: 'Split Token'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const params: TrustlyTransactionPreAuthParams = {
        amount: answers.amount.toFixed(2),
        merchantReference: answers.merchantReference || uuid(),
        period: 72,
        splitToken: answers.splitToken
    };

    console.log();
    console.log(`Sending request:`, params);
    console.log();
    const startTime = Date.now();
    const response = await Context.client.transaction.preAuth(answers.transactionId, params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}