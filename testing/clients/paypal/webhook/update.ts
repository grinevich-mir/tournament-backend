import { PayPalWebhookPatchParams } from '@tcom/platform/lib/integration/paypal';
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
            name: 'op',
            type: 'select',
            message: 'Operation',
            choices: [
                {
                    title: 'add',
                    value: 'add'
                },
                {
                    title: 'remove',
                    value: 'remove'
                },
                {
                    title: 'replace',
                    value: 'replace'
                },
                {
                    title: 'move',
                    value: 'move'
                },
                {
                    title: 'copy',
                    value: 'copy'
                },
                {
                    title: 'test',
                    value: 'test'
                }
            ]
        },
        {
            name: 'path',
            type: 'text',
            message: 'Path'
        },
        {
            name: 'value',
            type: 'text',
            message: 'Value'
        },
        {
            name: 'from',
            type: 'text',
            message: 'From'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const params: PayPalWebhookPatchParams = {
       op: answers.op,
       path: answers.path,
       value: answers.value,
       from: answers.from
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