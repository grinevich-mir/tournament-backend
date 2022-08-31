import prompts from 'prompts';
import { PaymentwallClient } from '@tcom/platform/lib/integration/paymentwall';
import { BrandStageConfig, getBrandConfig, getBrands, getStages } from '@tools/common';
import AWS from 'aws-sdk';
import ora from 'ora';
import { Context } from './context';
import * as widget from './widget';
import * as payment from './payment-status';
import * as delivery from './delivery';
import figlet from 'figlet';

interface PaymentwallCredentials {
    appKey: string;
    secretKey: string;
}

async function getCredentials(brand: BrandStageConfig): Promise<PaymentwallCredentials> {
    const spinner = ora('Getting Credentials...').start();

    try {
        const credentials = new AWS.SharedIniFileCredentials({ profile: brand.aws.profile });
        AWS.config.credentials = credentials;

        const ssm = new AWS.SSM({
            region: 'us-east-1'
        });

        const appKeyParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/paymentwall/app-key`,
            WithDecryption: false
        }).promise();

        if (!appKeyParam?.Parameter?.Value)
            throw new Error('App Key parameter not found.');

        const secretKeyParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/paymentwall/secret-key`,
            WithDecryption: true
        }).promise();

        if (!secretKeyParam?.Parameter?.Value)
            throw new Error('Secret Key parameter not found.');

        return {
            appKey: appKeyParam.Parameter.Value,
            secretKey: secretKeyParam.Parameter.Value
        };
    } catch (err) {
        spinner.stop();
        console.log();
        console.log(err);
        throw err;
    } finally {
        spinner.stop();
    }
}

async function print(text: string): Promise<void> {
    return new Promise(resolve => {
        figlet(text, (_err, data) => {
            console.log(data);
            resolve();
        });
    });
}

async function main(): Promise<void> {
    console.clear();

    await print('Paymentwall');
    console.log(' ------------------------ TEST CLIENT ------------------------');
    console.log();

    const brands = await getBrands();

    if (!brands || brands.length === 0)
        throw new Error('No brands found.');

    const brandChoice = await prompts({
        name: 'brand',
        type: 'select',
        message: 'Brand',
        choices: brands.map(b => ({
            title: b.name,
            value: b.id
        }))
    },
    {
        onCancel: () => process.exit(0)
    });

    const stages = await getStages(brandChoice.brand);

    const stageChoice = await prompts({
        name: 'stage',
        type: 'select',
        message: 'Stage',
        choices: stages.map(s => ({
            title: s,
            value: s
        }))
    },
    {
        onCancel: () => process.exit(0)
    });

    const brandConfig = await getBrandConfig(brandChoice.brand, stageChoice.stage);
    const credentials = await getCredentials(brandConfig);
    Context.client = new PaymentwallClient(credentials.appKey, credentials.secretKey);
    await actions();
}

enum Actions {
    GetWidgetUrl,
    GetPaymentStatus,
    ConfirmDelivery
}

const actionMap = [
    {
        action: Actions.GetWidgetUrl,
        title: 'Widget: Get Url',
        handler: async () => widget.getUrl()
    },
    {
        action: Actions.GetPaymentStatus,
        title: 'Payment Status: Get',
        handler: async () => payment.get()
    },
    {
        action: Actions.ConfirmDelivery,
        title: 'Delivery: Confirm',
        handler: async () => delivery.confirm()
    }
];

async function actions(): Promise<void> {
    const answer = await prompts({
        name: 'action',
        type: 'select',
        message: 'Action',
        choices: actionMap.map(item => ({
            title: item.title,
            value: item.action
        }))
    },
    {
        onCancel: () => process.exit(0)
    });

    try {
        const item = actionMap.find(i => i.action === answer.action);

        if (!item)
            return;

        await item.handler();
    } catch (err) {
        console.error(err);
    } finally {
        console.log();
        await actions();
    }
}

main().catch(() => { });