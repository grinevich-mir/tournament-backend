import prompts from 'prompts';
import { Context } from '../context';

export async function getAuthorization(): Promise<void> {
    const answers = await prompts([
        {
            name: 'authorizationId',
            type: 'text',
            message: 'Authorization ID'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    console.log();
    console.log(`Getting authorization:`, answers.authorizationId);

    console.log();
    const startTime = Date.now();
    const response = await Context.client.payIn.get(answers.authorizationId);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}