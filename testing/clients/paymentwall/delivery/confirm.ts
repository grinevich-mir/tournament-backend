import prompts from 'prompts';
import { Context } from '../context';
import { DeliveryConfirmationParams } from '@tcom/platform/src/integration/paymentwall';
import moment from 'moment';

export async function confirm(): Promise<void> {
    const answers = await prompts([
        {
            name: 'ref',
            type: 'text',
            message: 'Payment Ref'
        },
        {
            name: 'orderId',
            type: 'text',
            message: 'Order ID'
        },
        {
            name: 'email',
            type: 'text',
            message: 'Customer Email Address',
            initial: 'hb@tournament.com'
        },
        {
            name: 'type',
            type: 'select',
            message: 'Choose Type',
            choices: [
                { title: 'Digital', value: 'digital' },
                { title: 'Physical', value: 'physical' }
            ]
        },
        {
            name: 'status',
            type: 'select',
            message: 'Choose Status',
            choices: [
                { title: 'Delivered', value: 'delivered' },
                { title: 'Refund Issued', value: 'refund_issued' }
            ]
        },
        {
            name: 'reason',
            type: 'text',
            message: 'Reason',
            initial: 'None'
        },
        {
            name: 'estimatedDelivery',
            type: 'text',
            message: 'Estimated Delivery',
            initial: moment().utc().format('YYYY/MM/DD hh:mm:ss')
        },
        {
            name: 'estimatedUpdate',
            type: 'text',
            message: 'Estimated Update',
            initial: moment().utc().format('YYYY/MM/DD hh:mm:ss')
        },
        {
            name: 'details',
            type: 'text',
            message: 'Details',
            initial: 'Tickets have been awarded to account.'
        },
        {
            name: 'refundable',
            type: 'confirm',
            message: 'Refundable',
            initial: false
        },
        {
            name: 'isTest',
            type: 'confirm',
            message: 'Is Test?',
            initial: false
        }
    ],
    {
        onCancel: () => process.exit(0)
    });

    const params: DeliveryConfirmationParams = {
        payment_id: answers.ref,
        merchant_reference_id: answers.orderId,
        'shipping_address[email]': answers.email,
        type: answers.type,
        status: answers.status,
        reason: answers.reason,
        estimated_delivery_datetime: answers.estimatedDelivery,
        estimated_update_datetime: answers.estimatedUpdate,
        details: answers.details,
        refundable: answers.refundable,
        is_test: answers.isTest ? 1 : 0,
        attachments: {}
    };

    console.log();
    console.log('Sending Params:', params);
    console.log();

    const startTime = Date.now();
    const response = await Context.client.delivery.confirm(params);

    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log();
    console.log('Response:', response);
}