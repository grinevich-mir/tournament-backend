import { PayPalEnvironmentBase } from './environment';

export class PayPalLiveEnvironment extends PayPalEnvironmentBase {
    constructor(clientId: string, clientSecret: string) {
        super(clientId, clientSecret, 'https://api.paypal.com', 'https://www.paypal.com');
    }
}