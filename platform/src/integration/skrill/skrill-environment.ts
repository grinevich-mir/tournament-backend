export class SkrillEnvironment {
    public readonly checkoutUrl = 'https://pay.skrill.com';
    public readonly queryUrl = 'https://www.skrill.com/app/query.pl';

    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly statusUrl: string) {
    }
}