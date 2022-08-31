import { Context } from '../context';
import prompts from 'prompts';

export async function getCaptureDetails(): Promise<void> {
    const params = await prompts([
        {
            name: 'id',
            type: 'text',
            message: 'Capture ID'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    console.log();
    console.log(`Sending request:`, { id: params.id });
    console.log();
    const startTime = Date.now();
    const response = await Context.client.payment.getCaptureDetails(params.id);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response ?? 'NOT FOUND');
}