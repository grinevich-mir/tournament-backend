#! /usr/bin/env node
const program = require('commander');
const AWS = require('aws-sdk');
const ora = require('ora');
const shelljs = require('shelljs');
const colog = require('colog');
const { getBrandConfig }  = require('@tools/common');

process.on('unhandledRejection', () => {
    process.exit(1);
});

async function loadAWSCredentials(brand, stage) {
    const brandConfig = await getBrandConfig(brand, stage);

    if (!brandConfig)
        throw new Error(`Brand ${brand} not found in config.`);

    const credentials = new AWS.SharedIniFileCredentials({ profile: brandConfig.aws.profile });
    AWS.config.credentials = credentials;
}

async function getRepositoryData(brand, stage, region) {
    await loadAWSCredentials(brand, stage);
    const ecr = new AWS.ECR({
        region
    });
    const result = await ecr.getAuthorizationToken().promise();
    const authData = result.authorizationData[0];
    return [authData.authorizationToken, authData.proxyEndpoint];
}

function dockerLogin(endpoint, username, password) {
    return new Promise((resolve, reject) => {
        shelljs.exec(`echo ${password} | docker login ${endpoint} -u ${username} --password-stdin`, { silent: true }, (code, stdout, stderr) => {
            if (stderr && code > 0) {
                reject(new Error(stderr));
                return;
            }
    
            if (code === 0)
                resolve(endpoint);
        });
    })
}

function dockerTag(repo, endpoint, tag) {
    return new Promise((resolve, reject) => {
        const tagEndpoint = endpoint.replace('https://', '');
        shelljs.exec(`docker tag ${repo}:${tag} ${tagEndpoint}/${repo}:${tag};`, { silent: true }, (code, stdout, stderr) => {
            if (stderr) {
                reject(new Error(stderr));
                return;
            }
    
            if (code === 0) {
                ora().succeed(`Tagged docker image ${repo}:${tag} to ${tagEndpoint}/${repo}:${tag}`);
                resolve(endpoint);
            }
        });
    });
}

function dockerPush(repo, endpoint, tag) {
    colog.headerInfo('Pushing docker image...');
    const spinner = ora('Pushing...').start();

    return new Promise((resolve, reject) => {
        shelljs.exec(`docker push ${endpoint.replace('https://', '')}/${repo}:${tag};`, { silent: true }, (code, stdout, stderr) => {
            if (stderr) {
                spinner.fail('Push failed.');
                reject(new Error(stderr));
                return;
            }
    
            if (code === 0) {
                spinner.stop();
                colog.success(stdout);
                spinner.succeed('Push succeeded.');
                resolve(endpoint);
            }
        });
    });
}

async function repoLogin(brand, stage, region) {
    const spinner = ora(`Please wait...`).start();

    try {
        spinner.text = 'Getting repository data...';
        const [token, endpoint] = await getRepositoryData(brand, stage, region);
        const buffer = new Buffer.from(token, 'base64');
        const [username, password] = buffer.toString().split(':');
        spinner.text = 'Logging into repository...';
        await dockerLogin(endpoint, username, password);
        spinner.succeed('Login succeeded.');
        return endpoint;
    } catch (err) {
        spinner.fail('Login failed.');
        throw err;
    }
}

async function updateService(region, clusterName, serviceName) {
    const ecs = new AWS.ECS({ region });

    const services = await ecs.listServices({ cluster: clusterName, launchType: 'FARGATE' }).promise();

    if (services.serviceArns.length === 0)
        throw new Error('No services found.');

    const result = await ecs.describeServices({ cluster: clusterName, services: services.serviceArns }).promise();
    const service = result.services.find(s => s.serviceName === serviceName);

    if (!service)
        throw new Error(`Service '${serviceName}' not found.`);

    colog.info('Updating service...');
    await ecs.updateService({ 
        cluster: clusterName,
        service: serviceName, 
        forceNewDeployment: true
    }).promise();
    colog.success('Service updated.');
}

function divider() {
    console.log('--------------------------------------------------------------------');
}

program
    .command('push <repo>')
    .description('Pushes a docker image to AWS')
    .option('-r, --region <region>', 'The repository region', 'us-east-1')
    .option('-s, --brand <brand>', 'The repository brand')
    .option('-s, --stage <stage>', 'The repository stage')
    .option('-t, --tag <tag>', 'The repository tag', 'latest')
    .option('--cluster <cluster>', 'The ECS cluster')
    .option('--service <service>', 'The ECS service')
    .action(async (repo, options) => {
        colog.headerInfo('AWS Docker: Push');
        
        try {
            if (!options.brand)
                throw new Error('--brand <brand> flag is required.');

            if (!options.stage)
                throw new Error('--stage <stage> flag is required.');

            const endpoint = await repoLogin(options.brand, options.stage, options.region);
            divider();
            colog.headerInfo('AWS:')
            console.log(`- Repository URI: ${endpoint}`);
            divider();
            await dockerTag(repo, endpoint, options.tag);
            console.log();
            await dockerPush(repo, endpoint, options.tag);

            if (!options.cluster && !options.service)
                return;

            if (options.cluster && !options.service)
                throw new Error('The --service parameter must be present with the --cluster parameter');

            if (options.cluster && !options.service)
                throw new Error('The --service parameter must be present with the --cluster parameter');

            await updateService(options.region, options.cluster, options.service);

        } catch (err) {
            if (err instanceof Error)
                colog.error(`ERROR: ${err.message}`);
            else
                colog.error(err);

            process.exit(1);
        }
    });

program.parse(process.argv);