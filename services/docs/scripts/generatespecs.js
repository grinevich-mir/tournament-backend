const fs = require('fs');
const execa = require('execa');
const handlebars = require('handlebars');
const rimraf = require('rimraf');

const options = {
    brand: process.argv[2],
    stage: process.argv[3],
    api: process.argv[4],
    host: process.argv[5],
    region: process.argv[6],
    dest: process.argv[7]
};

async function run() {
    rimraf.sync('specs');
    fs.mkdirSync('specs');

    await execa.command(`yarn --cwd ../../ swagger --brand ${options.brand} --stage ${options.stage} --scope @tcom/service-${options.api}-* --dest ${options.dest} --host ${options.host}`, {
        stdio: 'inherit'
    });

    console.log('Replacing variables in spec files...');

    const specs = fs.readdirSync('specs');

    for (const spec of specs) {
        const file = `specs/${spec}`;
        const content = fs.readFileSync(file, { encoding: 'utf-8' });
        const template = handlebars.compile(content);

        const data = {
            DOMAIN: options.host
        };

        for (const key of Object.keys(options))
            data[key.toUpperCase()] = options[key];

        const result = template(data);
        
        fs.writeFileSync(file, result, { encoding: 'utf-8' });
    }
}

run();
