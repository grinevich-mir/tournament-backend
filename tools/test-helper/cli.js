#! /usr/bin/env node
const program = require('commander');
const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const loadJsonFile = require('load-json-file');

process.on('unhandledRejection', (err) => {
    if (err instanceof Error) {
        console.error(err.message);
        return;
    }

    console.error(err);
});

program
    .command('copy <destination>')
    .option('-f, --filename <filename>', 'The test result file name to look for.', 'test-results.xml')
    .option('-c, --clear', 'Clear out existing files at destination.')
    .description('Copies and renames test result XML files to the specified location')
    .action(async (destination, options) => {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        } else if (options.clear) {
            const existing = fs.readdirSync(destination);

            for (const file of existing)
                fs.unlinkSync(path.join(destination, file));
        }

        const glob = `**/*/${options.filename}`;
        const files = await fg(glob, {
            ignore: ['node_modules/**', destination]
        });

        for (const file of files) {
            const dir = path.dirname(file);
            const packageFile = `${dir}/package.json`;

            if (!fs.existsSync(packageFile))
                throw new Error(`Could not find package file at ${packageFile}`);

            const package = await loadJsonFile(packageFile);

            if (!package || !package.name)
                throw new Error(`Invalid package file at ${packageFile}`);

            const filename = package.name.replace('/', '-').replace('@', '') + '.xml';
            const fileDestination = path.join(destination, filename);
            console.info(`Copying ${file} -> ${fileDestination}`);
            fs.copyFileSync(file, fileDestination);
        }
    });

program.parse(process.argv);