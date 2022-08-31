import { PayPalWebhookCreateParams } from '@tcom/platform/lib/integration/paypal';
import prompts from 'prompts';
import { Context } from '../context';

export async function create(): Promise<void> {
    const events = await Context.client.webhook.getEventTypes();
    const answers = await prompts([
        {
            name: 'webhookName',
            type: 'text',
            message: 'Webhook Name',
        },
        {
            name: 'url',
            type: 'text',
            message: 'URL'
        },
        {
            name: 'eventTypes',
            type: 'multiselect',
            message: 'Choose Events',
            choices: events.event_types.map(t => {
                return { title: t.name, value: t.name };
            })
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const params: PayPalWebhookCreateParams = {
        url: answers.url,
        event_types: answers.eventTypes.map((t: string) => {
            return { name: t };
        })
    };

    console.log();
    console.log(`Sending request:`, params);

    console.log();
    const startTime = Date.now();
    const response = await Context.client.webhook.create(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}