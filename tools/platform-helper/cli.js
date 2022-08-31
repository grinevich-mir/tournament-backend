#! /usr/bin/env node
const program = require('commander');
const reset = require('./reset');
const ssmSync = require('./ssm-sync');
const select = require('@tools/common/selection');
const colog = require('colog');

program
    .command('reset')
    .description('Resets an environment.')
    .option('--brand <brand>', 'The brand.')
    .option('--stage <stage>', 'The stage.')
    .option('-s, --step <step>', 'The step you want to run.')
    .option('-f, --from <step>', 'The step to start from.')
    .action(async (options) => {
        await select.prompt(options);
        await reset(options.brand, options.stage, {
            step: options.step,
            from: options.from
        });
    });

program
    .command('ssm:sync')
    .description('Synchronises SSM parameters from one region to another.')
    .action(async () => {
        async function getTarget(label) {
            const brand = await select.brand(label);
            const stage = await select.stage(brand, label);
            const region = await select.region(brand, label);
            return {
                brand,
                stage,
                region
            }
        }

        colog.headerInfo('Source');
        const source = await getTarget();
        colog.headerInfo('Target');
        const target = await getTarget();

        if (source.brand === target.brand && source.stage === target.stage && source.region === target.region)
            throw new Error('The source and target are the same.');

        await ssmSync(source, target);
    });

program.parse(process.argv);