import prompts from 'prompts';
import { Context } from '../context';

export async function update(): Promise<void> {
    const answers = await prompts([
        {
            name: 'webhookId',
            type: 'text',
            message: 'Webhook ID'
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

    const params = {
        email: answers.email,
        url: answers.url,
        validity: 'valid'
    };

    console.log();
    console.log(`Sending request:`, params);

    console.log();
    const startTime = Date.now();
    const response = await Context.client.webhook.update(answers.webhookId, params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}