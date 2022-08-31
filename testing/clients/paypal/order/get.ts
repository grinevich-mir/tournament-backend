import { Context } from '../context';
import prompts from 'prompts';

export async function get(): Promise<void> {
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
                { title: 'PERMISSION_DENIED', value: 'PERMISSION_DENIED' },
                { title: 'INVALID_RESOURCE_ID', value: 'INVALID_RESOURCE_ID' },
                { title: 'INVALID_ACCOUNT_STATUS', value: 'INVALID_ACCOUNT_STATUS' }
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
    console.log(`Sending request:`, params);
    console.log();
    const startTime = Date.now();
    const response = await Context.client.order.get(params.id, headers);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response ?? 'NOT FOUND');
}