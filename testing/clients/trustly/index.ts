import prompts from 'prompts';
import { TrustlyClient } from '@tcom/platform/lib/integration/trustly';
import { BrandStageConfig, getBrandConfig, getBrands, getStages } from '@tools/common';
import AWS from 'aws-sdk';
import ora from 'ora';
import { Context } from './context';
import * as transaction from './transaction';
import * as customer from './customer';
import figlet from 'figlet';

interface TrustlyCredentials {
    accessId: string;
    accessKey: string;
    merchantId: string;
}

async function getCredentials(brand: BrandStageConfig): Promise<TrustlyCredentials> {
    const spinner = ora('Getting Credentials...').start();
    try {
        const credentials = new AWS.SharedIniFileCredentials({ profile: brand.aws.profile });
        AWS.config.credentials = credentials;

        const ssm = new AWS.SSM({
            region: 'us-east-1'
        });

        const accessIdParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/trustly/access-id`,
            WithDecryption: false
        }).promise();

        if (!accessIdParam?.Parameter?.Value)
            throw new Error('Access ID parameter not found.');

        const accessKeyParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/trustly/access-key`,
            WithDecryption: true
        }).promise();

        if (!accessKeyParam?.Parameter?.Value)
            throw new Error('Access Key parameter not found.');

        const merchantIdParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/trustly/merchant-id`,
            WithDecryption: true
        }).promise();

        if (!merchantIdParam?.Parameter?.Value)
            throw new Error('Merchant ID parameter not found.');

        return {
            accessId: accessIdParam.Parameter.Value,
            accessKey: accessKeyParam.Parameter.Value,
            merchantId: merchantIdParam.Parameter.Value
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

    await print('Trustly');
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

    const credentials = await getCredentials(brandConfig);
    Context.client = new TrustlyClient(credentials.accessId, credentials.accessKey, stageChoice.stage === 'prod' ? 'live' : 'test');
    Context.merchantId = credentials.merchantId;

    await actions();
}

enum Actions {
    ListTransactions,
    GetTransaction,
    EstablishTransaction,
    PreAuthTransaction,
    CaptureTransaction,
    GetCustomer,
    GetCustomerByExternalId
}

const actionMap = [
    {
        action: Actions.ListTransactions,
        title: 'Transaction: List',
        handler: async () => transaction.list()
    },
    {
        action: Actions.GetTransaction,
        title: 'Transaction: Get',
        handler: async () => transaction.get()
    },
    {
        action: Actions.EstablishTransaction,
        title: 'Transaction: Establish',
        handler: async () => transaction.establish()
    },
    {
        action: Actions.PreAuthTransaction,
        title: 'Transaction: Pre Auth',
        handler: async () => transaction.preAuth()
    },
    {
        action: Actions.CaptureTransaction,
        title: 'Transaction: Capture',
        handler: async () => transaction.capture()
    },
    {
        action: Actions.GetCustomer,
        title: 'Customer: Get',
        handler: async () => customer.get()
    },
    {
        action: Actions.GetCustomerByExternalId,
        title: 'Customer: Get by External ID',
        handler: async () => customer.getByExternalId()
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

main().catch(() => {});
