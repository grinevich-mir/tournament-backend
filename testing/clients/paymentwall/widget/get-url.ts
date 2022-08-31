import prompts from 'prompts';
import { Context } from '../context';
import { v4 as uuid } from 'uuid';

export async function getUrl(): Promise<void> {
    const answers = await prompts([
        {
            name: 'userId',
            type: 'number',
            message: 'User ID',
            initial: '1'
        },
        {
            name: 'widgetCode',
            type: 'text',
            message: 'Widget Code',
            initial: 'pw_1'
        },
        {
            name: 'productId',
            type: 'text',
            message: 'Product ID',
            initial: uuid()
        },
        {
            name: 'productName',
            type: 'text',
            message: 'Product Name',
            initial: '100 Diamonds'
        },
        {
            name: 'productAmount',
            type: 'number',
            message: 'Amount',
            initial: 10
        },
        {
            name: 'productCurrency',
            type: 'text',
            message: 'Product Currency',
            initial: 'USD'
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const startTime = Date.now();
    const response = await Context.client.widget.getUrl(
        answers.userId,
        answers.widgetCode,
        [
            {
                id: answers.productId,
                amount: answers.productAmount.toFixed(2),
                currencyCode: answers.productCurrency,
                name: answers.productName
            }
        ]
    );
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}