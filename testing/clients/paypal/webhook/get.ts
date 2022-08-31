import prompts from 'prompts';
import { Context } from '../context';

export async function get(): Promise<void> {
    const params = await prompts([
        {
            name: 'webhookId',
            type: 'text',
            message: 'Webhook ID'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    console.log();
    const startTime = Date.now();
    const response = await Context.client.webhook.get(params.webhookId);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}