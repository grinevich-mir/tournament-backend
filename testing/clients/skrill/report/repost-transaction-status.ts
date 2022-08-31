import { Context } from '../context';
import prompts from 'prompts';

export async function repostTransactionStatus(): Promise<void> {
    const answers = await prompts([
        {
            name: 'providerRef',
            type: 'number',
            message: 'Provider Ref'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const startTime = Date.now();
    const response = await Context.client.report.repostTransactionStatus(answers.providerRef);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}