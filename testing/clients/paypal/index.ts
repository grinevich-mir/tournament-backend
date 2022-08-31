import prompts from 'prompts';
import { BrandStageConfig, getBrandConfig, getBrands, getStages } from '@tools/common';
import AWS from 'aws-sdk';
import ora from 'ora';
import { Context } from './context';
import * as token from './token';
import * as order from './order';
import * as webhook from './webhook';
import * as payment from './payment';
import figlet from 'figlet';
import { PayPalLiveEnvironment, PayPalSandboxEnvironment } from '@tcom/platform/lib/integration/paypal/environments';
import { PayPalClient, PayPalEnvironment } from '@tcom/platform/lib/integration/paypal';

async function getEnvironment(brand: BrandStageConfig): Promise<PayPalEnvironment> {
    const spinner = ora('Getting Credentials...').start();

    try {
        const credentials = new AWS.SharedIniFileCredentials({ profile: brand.aws.profile });
        AWS.config.credentials = credentials;

        const ssm = new AWS.SSM({
            region: 'us-east-1'
        });

        const clientIdParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/paypal/client-id`,
            WithDecryption: false
        }).promise();

        if (!clientIdParam?.Parameter?.Value)
            throw new Error('Client ID parameter not found.');

        const clientSecretParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/paypal/client-secret`,
            WithDecryption: true
        }).promise();

        if (!clientSecretParam?.Parameter?.Value)
            throw new Error('Client Secret parameter not found.');

        return brand.stage === 'prod'
            ? new PayPalLiveEnvironment(clientIdParam.Parameter.Value, clientSecretParam.Parameter.Value)
            : new PayPalSandboxEnvironment(clientIdParam.Parameter.Value, clientSecretParam.Parameter.Value);

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

    await print('PayPal');
    console.log(' -------------------------------- TEST CLIENT --------------------------------');
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
    const environment = await getEnvironment(brandConfig);

    Context.client = new PayPalClient(environment);

    await actions();
}

enum Actions {
    GetAccessToken,
    CreateOrder,
    GetOrder,
    CaptureOrder,
    GetCaptureDetails,
    GetWebhooks,
    GetWebhookById,
    CreateWebhook,
    UpdateWebhook,
    DeleteWebhook
}

const actionMap = [
    {
        action: Actions.GetAccessToken,
        title: 'Token: Get',
        handler: async () => token.get()
    },
    {
        action: Actions.CreateOrder,
        title: 'Order: Create',
        handler: async () => order.create()
    },
    {
        action: Actions.GetOrder,
        title: 'Order: Get',
        handler: async () => order.get()
    },
    {
        action: Actions.CaptureOrder,
        title: 'Order: Capture',
        handler: async () => order.capture()
    },
    {
        action: Actions.GetCaptureDetails,
        title: 'Payment: Get Capture',
        handler: async () => payment.getCaptureDetails()
    },
    {
        action: Actions.GetWebhooks,
        title: 'Webhooks: Get All',
        handler: async () => webhook.getAll()
    },
    {
        action: Actions.GetWebhookById,
        title: 'Webhooks: Get',
        handler: async () => webhook.get()
    },
    {
        action: Actions.CreateWebhook,
        title: 'Webhooks: Create',
        handler: async () => webhook.create()
    },
    {
        action: Actions.UpdateWebhook,
        title: 'Webhooks: Update',
        handler: async () => webhook.update()
    },
    {
        action: Actions.DeleteWebhook,
        title: 'Webhooks: Delete',
        handler: async () => webhook.remove()
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