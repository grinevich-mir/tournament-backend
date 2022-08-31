import prompts from 'prompts';
import { Context } from '../context';

export async function get(): Promise<void> {
    const answers = await prompts([
        {
            name: 'transactionId',
            type: 'number',
            message: 'Transaction ID'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const startTime = Date.now();
    const response = await Context.client.transaction.get(answers.transactionId);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}