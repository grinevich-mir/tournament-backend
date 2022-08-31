import prompts from 'prompts';
import { Context } from '../context';

export async function get(): Promise<void> {
    const answers = await prompts([
        {
            name: 'customerId',
            type: 'number',
            message: 'Customer ID'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const startTime = Date.now();
    const response = await Context.client.customer.get(answers.customerId);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}