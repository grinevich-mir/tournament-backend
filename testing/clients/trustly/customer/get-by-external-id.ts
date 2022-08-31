import prompts from 'prompts';
import { Context } from '../context';

export async function getByExternalId(): Promise<void> {
    const answers = await prompts([
        {
            name: 'externalId',
            type: 'number',
            message: 'Customer External ID'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const startTime = Date.now();
    const response = await Context.client.customer.getByExternalId(answers.externalId);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}