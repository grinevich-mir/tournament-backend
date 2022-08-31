import prompts from 'prompts';
import { UnipaasClient } from '@tcom/platform/lib/integration/unipaas';
import { BrandStageConfig, getBrandConfig, getBrands, getStages } from '@tools/common';
import AWS from 'aws-sdk';
import ora from 'ora';
import { Context } from './context';
import * as payIn from './pay-in';
import * as webhook from './webhook';
import figlet from 'figlet';

async function getApiKey(brand: BrandStageConfig): Promise<string> {
    const spinner = ora('Getting API Key...').start();
    try {
        const credentials = new AWS.SharedIniFileCredentials({ profile: brand.aws.profile });
        AWS.config.credentials = credentials;

        const ssm = new AWS.SSM({
            region: 'us-east-1'
        });

        const apiKeyParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/unipaas/api-key`,
            WithDecryption: true
        }).promise();

        if (!apiKeyParam?.Parameter?.Value)
            throw new Error('API Key parameter not found.');

        return apiKeyParam.Parameter.Value;
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

    await print('Unipaas');
    console.log(' ------------ TEST CLIENT ------------');
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

    const apiKey = await getApiKey(brandConfig);
    Context.client = new UnipaasClient(apiKey, stageChoice.stage === 'prod' ? 'live' : 'test');

    await actions();
}

enum Actions {
    Checkout,
    CheckoutExisting,
    GetToken,
    Authorize,
    GetAuthorization,
    GetWebhooks,
    CreateWebhook,
    UpdateWebhook,
    DeleteWebhook
}

const actionMap = [
    {
        action: Actions.Checkout,
        title: 'Pay In: Checkout',
        handler: async () => payIn.checkout()
    },
    {
        action: Actions.CheckoutExisting,
        title: 'Pay In: Checkout with Existing Payment Option',
        handler: async () => payIn.checkoutExisting()
    },
    {
        action: Actions.GetToken,
        title: 'Pay In: Get Token',
        handler: async () => payIn.getToken()
    },
    {
        action: Actions.Authorize,
        title: 'Pay In: Authorize',
        handler: async () => payIn.authorize()
    },
    {
        action: Actions.GetAuthorization,
        title: 'Pay In: Get Authorization',
        handler: async () => payIn.getAuthorization()
    },
    {
        action: Actions.GetWebhooks,
        title: 'Webhooks: Get All',
        handler: async () => webhook.getAll()
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
        if (err.response)
            console.log(err.response.data.message);

        console.error(err);
    } finally {
        console.log();
        await actions();
    }
}

main().catch(() => {});
