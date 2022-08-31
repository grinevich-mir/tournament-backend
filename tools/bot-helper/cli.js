#! /usr/bin/env node
const program = require('commander');
const colog = require('colog');
const select = require('@tools/common/selection');
const fs = require('fs');
const mkdirp = require('mkdirp');
const AWS = require('aws-sdk');
const ora = require('ora');
const _ = require('lodash');
const { getBrandConfig }  = require('@tools/common');

let awsSet = false;

async function setupAWS(brand, stage) {
    if (awsSet)
        return;

    const brandConfig = await getBrandConfig(brand, stage);
    colog.info('Setting up AWS credentials...');
    var credentials = new AWS.SharedIniFileCredentials({ profile: brandConfig.aws.profile });
    AWS.config.credentials = credentials;
    awsSet = true;
}

async function createBots(stage, config) {
    const lambdaName = `testing-${stage}-generateBots`;
    const lambda = new AWS.Lambda({ region: 'us-east-1' });
    const result = await lambda.invoke({ FunctionName: lambdaName, Payload: JSON.stringify(config) }).promise();
    const payload = JSON.parse(result.Payload);

    if (!payload || payload.length === 0)
        throw new Error('Bot creation failed, result payload empty.');

    return payload;    
}

program
    .command('create')
    .option('--brand <brand>', 'The brand.')
    .option('--stage <stage>', 'The stage.')
    .option('--count <count>', 'The number of bots to create.')
    .option('--skin <skin>', 'Which skin to create the bots on.')
    .option('--no-confirm', 'Disable confirmation')
    .option('-o --output <path>', 'Path to store output file.', './.bots')
    .description('Creates bots.')
    .action(async (options) => {               
        await select.prompt(options, {
            skin: true
        });

        if (!options.count)
            count = await select.number('How many?', 10);
        else
            count = parseInt(options.count);
        
        if (isNaN(count)) {
            colog.error('Count must be a number.');
            return;
        }

        colog.warning(`You are about to generate ${count} bot(s)!`);

        if (options.confirm) {
            const answer = await select.confirm('Are you sure you want to continue?', false);

            if (!answer) {
                console.warn('Aborted.');
                return;
            }
        }

        const brand = options.brand;
        const stage = options.stage;

        await setupAWS(brand, stage);

        if (!fs.existsSync(options.output))
            mkdirp(options.output);

        console.info(`Generating ${count} bots...`);
        const spinner = ora(`Please wait...`);
        spinner.start();

        let generatedBots = 0;
        const bots = _.chunk(_.range(0, count), 10).map(c => c.length);
        const filePath = `${options.output}/bots-${brand}-${new Date().getTime()}.txt`;

        try {
            for (const batch of bots) {
                const emails = await createBots(stage, {
                    count: batch,
                    skin: options.skin,
                    cognito: true
                });

                fs.appendFileSync(filePath, emails.join(`\n`) + `\n`);

                generatedBots += batch;
                spinner.text = `${generatedBots} of ${count} bot(s) generated.`;
            }

            spinner.succeed(`${generatedBots} of ${count} bot(s) generated.`);
        } finally {
            if (spinner.isSpinning)
                spinner.stop();
        }
    });

program.parse(process.argv);