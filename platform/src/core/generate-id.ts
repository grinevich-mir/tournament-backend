import generate from 'nanoid/generate';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateId(): string {
    return generate(alphabet, 21);
}