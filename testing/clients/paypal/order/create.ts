import { PayPalOrderParams } from '@tcom/platform/lib/integration/paypal';
import prompts from 'prompts';
import { Context } from '../context';

export async function create(): Promise<void> {
    const answers = await prompts([
        {
            name: 'intent',
            type: 'text',
            message: 'Intent',
            initial: 'CAPTURE'
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

    const params: PayPalOrderParams = {
        intent: answers.intent,
        purchase_units: [
            {
                amount: {
                    currency_code: answers.currency,
                    value: answers.amount
                }
            }
        ]
    };

    console.log();
    console.log(`Sending request:`, params);
    console.log();
    const startTime = Date.now();
    const response = await Context.client.order.create(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}