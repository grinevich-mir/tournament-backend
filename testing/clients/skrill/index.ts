import { SkrillEnvironment, SkrillClient } from '@tcom/platform/lib/integration/skrill';
import { SkrillCrypto } from '@tcom/platform/lib/integration/skrill/utilities';
import { BrandStageConfig, getBrandConfig, getBrands, getStages } from '@tools/common';
import { Context } from './context';
import * as checkout from './checkout';
import * as report from './report';
import prompts from 'prompts';
import AWS from 'aws-sdk';
import ora from 'ora';
import figlet from 'figlet';

async function getEnvironment(brand: BrandStageConfig): Promise<SkrillEnvironment> {
    const spinner = ora('Getting Credentials...').start();
    try {
        const credentials = new AWS.SharedIniFileCredentials({ profile: brand.aws.profile });
        AWS.config.credentials = credentials;

        const ssm = new AWS.SSM({
            region: 'us-east-1'
        });

        const emailParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/skrill/merchant-email`,
            WithDecryption: false
        }).promise();

        if (!emailParam?.Parameter?.Value)
            throw new Error('Merchant Email parameter not found.');


        const passwordParam = await ssm.getParameter({
            Name: `/${brand.stage}/integration/skrill/mqi-password`,
            WithDecryption: true
        }).promise();

        if (!passwordParam?.Parameter?.Value)
            throw new Error('MQI password parameter not found.');

        const crypto = new SkrillCrypto();

        return new SkrillEnvironment(
            emailParam.Parameter.Value,
            crypto.hash(passwordParam.Parameter.Value),
            `https://integrations.${brand.domain}/skrill/notification`);

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

    await print('Skrill');
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
    Context.client = new SkrillClient(environment);
    await actions();
}

enum Actions {
    PrepareCheckout,
    GetTransactionStatus,
    RepostTransactionStatus
}

const actionMap = [
    {
        action: Actions.PrepareCheckout,
        title: 'Checkout: Prepare',
        handler: async () => checkout.prepare()
    },
    {
        action: Actions.GetTransactionStatus,
        title: 'Report: Get Transaction Status',
        handler: async () => report.getTransactionStatus()
    },
    {
        action: Actions.RepostTransactionStatus,
        title: 'Report: Repost Transaction Status',
        handler: async () => report.repostTransactionStatus()
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
