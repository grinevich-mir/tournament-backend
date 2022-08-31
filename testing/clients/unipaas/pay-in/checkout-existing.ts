import prompts from 'prompts';
import { v4 as uuid } from 'uuid';
import { Context } from '../context';
import { UnipaasCheckoutParams, UnipaasAddress } from '@tcom/platform/lib/integration/unipaas';

export async function checkoutExisting(): Promise<void> {
    const answers = await prompts([
        {
            name: 'consumerId',
            type: 'text',
            message: 'Consumer ID'
        },
        {
            name: 'currency',
            type: 'text',
            message: 'Currency',
            initial: 'USD'
        },
        {
            name: 'amount',
            type: 'number',
            float: true,
            message: 'Amount'
        },
        {
            name: 'country',
            type: 'text',
            message: 'Country'
        },
        {
            name: 'email',
            type: 'text',
            message: 'Email'
        },
        {
            name: 'address',
            type: 'select',
            choices: [
                {
                    title: 'None',
                    value: 'none',
                    selected: true
                },
                {
                    title: 'Full',
                    value: 'full'
                },
                {
                    title: 'Partial',
                    value: 'partial'
                }
            ],
            message: 'Address'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const params: UnipaasCheckoutParams = {
        ...answers,
        reference: uuid(),
        orderId: uuid(),
        description: 'Some stuff'
    };

    if (answers.address === 'full')
        params.billingAddress = {
            firstName: 'Joe',
            lastName: 'Bloggs',
            city: 'Dereham',
            state: '',
            country: 'GB',
            line1: '19 Brussels Close',
            postalCode: 'NR19 1UR'
        } as UnipaasAddress;

    if (answers.address === 'partial')
        params.billingAddress = {
            state: '',
            country: 'GB',
            postalCode: 'NR19 1UR'
        } as UnipaasAddress;

    console.log();
    console.log(`Sending request:`, params);

    console.log();
    const startTime = Date.now();
    const response = await Context.client.payIn.checkout(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}