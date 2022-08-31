import { PayPalEnvironmentBase } from './environment';

export class PayPalSandboxEnvironment extends PayPalEnvironmentBase {
    constructor(clientId: string, clientSecret: string) {
        super(clientId, clientSecret, 'https://api.sandbox.paypal.com', 'https://www.sandbox.paypal.com');
    }
}