
import { PayPalErrorIssueType } from '@tcom/platform/lib/integration/paypal';
import { Context } from '../context';
import prompts from 'prompts';

export async function capture(): Promise<void> {
    const params = await prompts([
        {
            name: 'negative',
            type: 'confirm',
            message: 'Perform a Negative Test?',
            initial: false
        },
        {
            name: 'id',
            type: prev => prev === false ? 'text' : null,
            message: 'Order ID'
        },
        {
            name: 'error',
            type: prev => prev === true ? 'select' : null,
            message: 'Choose Error',
            choices: [
                { title: 'INTERNAL_SERVER_ERROR', value: 'INTERNAL_SERVER_ERROR' },
                ...Object.values(PayPalErrorIssueType).map(i => {
                    return { title: i, value: i };
                })
            ]
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    let headers = {};
    if (params.negative)
        headers = { 'paypal-mock-response': JSON.stringify({ mock_application_codes: params.error }) };

    console.log();
    console.log(`Sending request:`, { id: params.id, headers });
    console.log();
    const startTime = Date.now();
    const response = await Context.client.order.capture(params.id, headers);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}