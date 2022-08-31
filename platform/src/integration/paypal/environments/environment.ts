import { PayPalEnvironment } from '../interfaces';

export abstract class PayPalEnvironmentBase implements PayPalEnvironment {
    constructor(
        public readonly clientId: string,
        public readonly clientSecret: string,
        public readonly baseUrl: string,
        public readonly webUrl: string) {
    }
}