import prompts from 'prompts';
import { Context } from '../context';

export async function create(): Promise<void> {
    const params = await prompts([
        {
            name: 'webhookName',
            type: 'select',
            message: 'Webhook Name',
            choices: [
                {
                    title: 'authorization/update',
                    value: 'authorization/update'
                },
                {
                    title: 'ewallet/create',
                    value: 'ewallet/create'
                },
                {
                    title: 'payout/generate',
                    value: 'payout/generate'
                },
                {
                    title: 'payout/confirm',
                    value: 'payout/confirm'
                },
                {
                    title: 'payout/cancel',
                    value: 'payout/cancel'
                },
                {
                    title: 'payout/complete',
                    value: 'payout/complete'
                }
            ]
        },
        {
            name: 'email',
            type: 'text',
            message: 'Email'
        },
        {
            name: 'url',
            type: 'text',
            message: 'URL'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    console.log();
    console.log(`Sending request:`, params);

    console.log();
    const startTime = Date.now();
    const response = await Context.client.webhook.create(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}