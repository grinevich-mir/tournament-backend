import { Context } from '../context';

export async function get(): Promise<void> {
    console.log();
    const startTime = Date.now();
    const response = await Context.client.token.get();
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}