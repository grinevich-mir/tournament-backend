import { Context } from '../context';

export async function getAll(): Promise<void> {
    console.log();
    const startTime = Date.now();
    const response = await Context.client.webhook.getAll();
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}