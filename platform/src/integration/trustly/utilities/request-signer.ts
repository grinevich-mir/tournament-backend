import { Config, ParameterStore } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import crypto from 'crypto';
import _ from 'lodash';
import flatten from 'flat';

const KEYS = [
    'accessId',
    'merchantId',
    'description',
    'currency',
    'amount',
    'displayAmount',
    'minimumBalance',
    'merchantReference',
    'paymentType',
    'timeZone',
    'recurrence.startDate',
    'recurrence.endDate',
    'recurrence.frequency',
    'recurrence.frequencyUnit',
    'recurrence.frequencyUnitType',
    'recurrence.recurringAmount',
    'recurrence.automaticCapture',
    'verification.status',
    'verification.verifyCustomer',
    'customer.customerId',
    'customer.externalId',
    'customer.name',
    'customer.vip',
    'customer.taxId',
    'customer.driverLicense.number',
    'customer.driverLicense.state',
    'customer.address.address1',
    'customer.address.address2',
    'customer.address.city',
    'customer.address.state',
    'customer.address.zip',
    'customer.address.country',
    'customer.phone',
    'customer.email',
    'customer.balance',
    'customer.currency',
    'customer.enrollDate',
    'account.nameOnAccount',
    'account.name',
    'account.type',
    'account.profile',
    'account.accountNumber',
    'account.routingNumber',
    'transactionId'
];

@Singleton
export class TrustlyRequestSigner {
    constructor(@Inject private readonly parameterStore: ParameterStore) {
    }

    public async sign(data: string): Promise<string>;
    public async sign(data: { [key: string]: any }): Promise<string>;
    public async sign(data: string | { [key: string]: any }): Promise<string> {
        const accessKey = await this.parameterStore.get(`/${Config.stage}/integration/trustly/access-key`, true, true);

        let dataString: string;

        if (typeof data === 'string')
            dataString = data;
        else {
            const flattened = flatten<any, any>(data);
            const values: (string | number)[] = [];

            for (const key of KEYS) {
                if (flattened[key] === undefined || flattened[key] === null)
                    continue;

                values.push(`${key}=${flattened[key]}`);
            }

            dataString = values.join('&');
        }

        return crypto.createHmac('sha1', accessKey).update(dataString).digest('base64');
    }
}