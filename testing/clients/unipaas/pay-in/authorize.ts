import { NewUnipaasPaymentOptionType } from '@tcom/platform/lib/integration/unipaas';
import prompts from 'prompts';
import { v4 as uuid } from 'uuid';
import { Context } from '../context';

const testCards = [
    {
        type: NewUnipaasPaymentOptionType.Card,
        cardAccount: {
            nameOnCard: 'John Doe',
            expirationYear: '24',
            expirationMonth: '12',
            number: '4000027891380961',
            securityCode: '123'
        }
    },
    {
        type: NewUnipaasPaymentOptionType.Card,
        cardAccount: {
            nameOnCard: 'John Doe',
            expirationYear: '24',
            expirationMonth: '12',
            number: '4012001037141112',
            securityCode: '123'
        }
    },
    {
        type: NewUnipaasPaymentOptionType.Card,
        cardAccount: {
            nameOnCard: 'CL-BRW1',
            expirationYear: '24',
            expirationMonth: '12',
            number: '4000027891380961',
            securityCode: '123'
        }
    }
];

export async function authorize(): Promise<void> {
    const answers = await prompts([
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
            name: 'newCard',
            type: 'confirm',
            message: 'Add new card?'
        },
        {
            name: 'paymentOptionId',
            type: prev => !prev ? 'text' : null,
            message: 'Payment Option ID'
        },
        {
            name: 'card',
            type: (_prev, values) => values.newCard ? 'select' : null,
            choices: [
                { title: 'Simple Transaction', value: testCards[0] },
                { title: '3D Secure 1 Transaction', value: testCards[1] },
                { title: '3D Secure 2 Transaction', value: testCards[2] }
            ],
            message: 'Choose a test card'
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
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const orderId = uuid();

    const params: any = {
        amount: answers.amount,
        currency: answers.currency,
        orderId,
        consumer: {
            firstName: '',
            lastName: '',
            email: answers.email,
            country: answers.country
        },
        urls: {
            redirectUrl: `http://dev.tournament.com/payment-success?orderId=${orderId}`
        }
    };

    if (answers.paymentOptionId)
        params.paymentOptionId = answers.paymentOptionId;
    else
        params.paymentOption = answers.card;

    console.log();
    console.log(`Sending request:`, params);
    console.log();
    const startTime = Date.now();
    const response = await Context.client.payIn.authorize(params);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}