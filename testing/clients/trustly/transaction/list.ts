import { Context } from '../context';

export async function list(): Promise<void> {
    const startTime = Date.now();
    const response = await Context.client.transaction.list();
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}