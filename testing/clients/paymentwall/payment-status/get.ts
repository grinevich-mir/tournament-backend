import prompts from 'prompts';
import { Context } from '../context';

export async function get(): Promise<void> {
    const answers = await prompts([
        {
            name: 'ref',
            type: 'text',
            message: 'Payment Ref'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const startTime = Date.now();
    const response = await Context.client.payment.get(answers.ref);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}