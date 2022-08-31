#! /usr/bin/env node
const program = require('commander');
const filterPackages = require('@tools/common/filter-packages');
const runLerna = require('./run-lerna');
const path = require('path');
const fs = require('fs');
const select = require('@tools/common/selection');

process.on('unhandledRejection', error => {
    console.error(error);
    process.exit(1);
});

program
    .command('deploy')
    .description('Deploy filtered packages')
    .option('--brand <brand>', 'The brand.')
    .option('--stage <stage>', 'The stage.')
    .option('--region <region>', 'The region')
    .option('--scope <scope>', 'Scope')
    .option('--ignore <ignore>', 'Ignore')
    .option('--parallel', 'Run in parallal')
    .option('--no-bail', 'Keep going on error')
    .action(async (options) => {
        await select.prompt(options, { region: true });

        const args = [
            '--brand',
            options.brand,
            '--stage',
            options.stage
        ];

        if (options.region)
            args.push('--region', options.region);
        
        const packages = await filterPackages(options._name, options.brand, options.scope, options.ignore);
        await runLerna(options._name, packages, options.parallel, options.bail, args);
    });

program
    .command('deploy')
    .description('Deploy filtered packages')
    .command('remove')
    .description('Remove filtered packages')
    .option('--brand <brand>', 'The brand.')
    .option('--stage <stage>', 'The stage.')
    .option('--region <region>', 'The region')
    .option('--scope <scope>', 'Scope')
    .option('--ignore <ignore>', 'Ignore')
    .option('--parallel', 'Run in parallal')
    .option('--no-bail', 'Keep going on error')
    .action(async (options) => {
        await select.prompt(options, { region: true });

        const args = [
            '--brand',
            options.brand,
            '--stage',
            options.stage
        ];

        if (options.region)
            args.push('--region', options.region);
        
        const packages = await filterPackages(options._name, options.brand, options.scope, options.ignore);
        await runLerna(options._name, packages, options.parallel, options.bail, args);
    });

program
    .command('swagger')
    .description('Generated swagger docs for filtered packages')
    .option('--brand <brand>', 'The brand.')
    .option('--stage <stage>', 'The stage.')
    .option('--scope <scope>', 'Scope')
    .option('--host <host>', 'The API host')
    .option('--parallel', 'Run in parallel.')
    .option('--dest <dest>', 'Swagger file destination.')
    .option('--no-bail', 'Keep going on error')
    .action(async (options) => {
        await select.prompt(options);

        const args = [
            '-c',
            'tsoa.json'
        ];

        if (options.host)
            args.push('--host', options.host);
        
        const packages = await filterPackages(options._name, options.brand, options.scope);
        await runLerna(options._name, packages, options.parallel, options.bail, args);

        if (options.dest) {
            console.log('Moving swagger files to', options.dest);
            for (const package of packages) {
                const source = `${package.contents}/swagger.json`;
                const dirName = path.basename(package.contents);
                const destination = `${options.dest}/${dirName}.json`;
                console.log(source, '=>', destination);
                fs.renameSync(source, destination);
            }
        }
    });

program.parse(process.argv);