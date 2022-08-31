import prompts from 'prompts';
import { Context } from '../context';

export async function getToken(): Promise<void> {
    const params = await prompts([
        {
            name: 'country',
            type: 'text',
            message: 'Country'
        },
        {
            name: 'email',
            type: 'text',
            message: 'Email'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    console.log();
    console.log(`Sending request:`, params);

    console.log();
    const startTime = Date.now();
    const response = await Context.client.payIn.getToken(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}