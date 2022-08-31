const colog = require('colog');
const AWS = require('aws-sdk');
const ora = require('ora');
const shelljs = require('shelljs');
const SendBird = require('sendbird-nodejs');
const batchPromises = require('batch-promises');
const pause = require('node-pause');
const select = require('@tools/common/selection');
const { getBrandConfig } = require('@tools/common');

let awsSet = false;
const divider = '----------------------------------------------------------------------------------------------------';

let spinner = undefined;

const DEFAULT_REGION = 'us-east-1';

const regions = [
    DEFAULT_REGION
];

async function setupAWS(brand, stage) {
    if (awsSet)
        return;

    colog.info('Setting up AWS credentials...');
    const brandConfig = await getBrandConfig(brand, stage);

    var credentials = new AWS.SharedIniFileCredentials({ profile: brandConfig.aws.profile });
    AWS.config.credentials = credentials;
    awsSet = true;
}

async function getFeatures(brand, stage) {
    const brandConfig = await getBrandConfig(brand, stage);

    if (!brandConfig)
        throw new Error('Brand not found in brands config.');

    const features = [];

    for (const feature of Object.keys(brandConfig.features)) {
        if (brandConfig.features[feature] === true)
            features.push(feature);
    }

    return features;
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function emptyS3Bucket(bucket, prefix) {
    let continuationToken;
    let deleteCount = 0;

    while (true) {
        const s3 = new AWS.S3({ region: DEFAULT_REGION });
        const listResponse = await s3.listObjectsV2({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken
        }).promise();

        if (listResponse.Contents.length > 0) {
            const keys = listResponse.Contents.map(o => ({ Key: o.Key }));
            await s3.deleteObjects({
                Bucket: bucket,
                Delete: {
                    Objects: keys
                }
            }).promise();

            continuationToken = listResponse.NextContinuationToken;
            deleteCount += listResponse.Contents.length;
            spinner.text = `Deleted ${deleteCount}.`;
        }
        
        if (!listResponse.IsTruncated || !listResponse.NextContinuationToken)
            break;

        await sleep(1000);
    }
}

const steps = [
    {
        name: 'Stop Scheduled Lambdas',
        regional: true,
        action: async (region) => {
            const cwe = new AWS.CloudWatchEvents({ region: region });
            const rules = await cwe.listRules().promise();
            colog.progress(0, rules.Rules.length);

            for (const rule of rules.Rules) {
                await cwe.disableRule({ Name: rule.Name }).promise();
                colog.progress();
            }
        }
    },
    {
        name: 'Stop Bot Service',
        feature: "tournaments",
        regional: true,
        action: async (region) => {
            const cluster = 'tournament-cluster';
            const ecs = new AWS.ECS({ region });
            const services = await ecs.listServices({ cluster, launchType: 'FARGATE' }).promise();

            if (services.serviceArns.length === 0) {
                colog.warning('No services found.');
                return;
            }

            const result = await ecs.describeServices({ cluster, services: services.serviceArns }).promise();
            const botService = result.services.find(s => s.serviceName === 'TournamentBots');

            if (!botService) {
                colog.warning('Bot service not found.');
                return;
            }

            await ecs.updateService({ cluster, service: botService.serviceName, desiredCount: 0 }).promise();
            colog.success('Bot service stopped.');
        }
    },
    {
        name: 'Stop Tournament ECS Tasks',
        feature: "tournaments",
        regional: true,
        action: async (region) => {
            const cluster = 'tournament-cluster';
            const ecs = new AWS.ECS({ region });
            const initialResult = await ecs.listTasks({ cluster, launchType: 'FARGATE' }).promise();

            if (initialResult.taskArns.length === 0) {
                colog.info('No tasks found.');
                return;
            }

            colog.info('Stopping tasks...');
            colog.progress(0, initialResult.taskArns.length);
            for (const arn of initialResult.taskArns) {
                await ecs.stopTask({ cluster, task: arn }).promise();
                colog.progress();
            }

            console.log();
            spinner = ora('Waiting for tasks to finish...');
            spinner.start();
            while (true) {
                const result = await ecs.describeTasks({ cluster, tasks: initialResult.taskArns }).promise();

                const statuses = result.tasks.map(t => t.lastStatus);

                if (statuses.every(s => s === 'STOPPED'))
                    break;

                await sleep(2000);
            }

            spinner.stop();
            colog.success('All tasks stopped.');
        }
    },
    {
        name: 'Clear Cognito Users',
        action: async (brand, stage) => {
            const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });
            const poolsResult = await cognito.listUserPools({ MaxResults: 60 }).promise();

            const pools = poolsResult.UserPools.filter(p => p.Name.startsWith(`${stage}-player-`));

            async function deletePoolUsers(pool) {
                const usersResult = await cognito.listUsers({ UserPoolId: pool.Id }).promise();

                if (usersResult.Users.length === 0)
                    return;

                await batchPromises(2, usersResult.Users, async (user) => {
                    await cognito.adminDeleteUser({ UserPoolId: pool.Id, Username: user.Username }).promise();
                    colog.progress();
                });

                await deletePoolUsers(pool);
            }

            for (const pool of pools) {
                const poolDesc = await cognito.describeUserPool({ UserPoolId: pool.Id }).promise();
                colog.info(`Deleting users from User Pool '${pool.Name}'`);
                colog.progress(0, poolDesc.UserPool.EstimatedNumberOfUsers);

                await deletePoolUsers(pool);
            }
        }
    },
    {
        name: 'Clear SendBird Users',
        feature: "chat",
        skipOnError: true,
        action: async (brand, stage) => {
            spinner = ora('Please wait...');
            spinner.start();

            const ssm = new AWS.SSM({ region: DEFAULT_REGION });

            const appIdResult = await ssm.getParameter({
                Name: `/${stage}/integration/sendbird/app-id`,
                WithDecryption: true
            }).promise();

            const apiTokenResult = await ssm.getParameter({
                Name: `/${stage}/integration/sendbird/api-token`,
                WithDecryption: true
            }).promise();

            const appId = appIdResult.Parameter.Value;
            const apiToken = apiTokenResult.Parameter.Value;

            const sb = new SendBird(apiToken, `https://api-${appId}.sendbird.com/v3/`);
            let deleteCount = 0;

            async function deleteUsers() {
                const result = await sb.users.list();

                if (result.users.length === 0)
                    return;

                await batchPromises(50, result.users, async (user) => {
                    try {
                        await sb.users.delete(user.user_id);
                        deleteCount++;
                        spinner.text = `Deleted ${deleteCount} user(s).`;
                    } catch {}
                });

                await sleep(1000);
                await deleteUsers();
            }

            await deleteUsers();

            spinner.succeed('SendBird users deleted.');
        }
    },
    {
        name: 'Clear SendBird Channels',
        feature: "chat",
        disabled: false,
        skipOnError: true,
        action: async (brand, stage) => {
            spinner = ora('Please wait...');
            spinner.start();

            const ssm = new AWS.SSM({ region: DEFAULT_REGION });

            const appIdResult = await ssm.getParameter({
                Name: `/${stage}/integration/sendbird/app-id`,
                WithDecryption: true
            }).promise();

            const apiTokenResult = await ssm.getParameter({
                Name: `/${stage}/integration/sendbird/api-token`,
                WithDecryption: true
            }).promise();

            const appId = appIdResult.Parameter.Value;
            const apiToken = apiTokenResult.Parameter.Value;

            const sb = new SendBird(apiToken, `https://api-${appId}.sendbird.com/v3/`);
            let deleteCount = 0;

            const failed = [];

            async function deleteChannels() {
                const result = await sb.openChannels.list();

                if (result.channels.length === 0)
                    return;

                const channels = result.channels.filter(c => !failed.includes(c.channel_url));

                if (channels.length === 0)
                    return;

                await batchPromises(50, channels, async (channel) => {
                    try {
                        await sb.openChannels.delete(channel.channel_url);
                        deleteCount++;
                        spinner.text = `Deleted ${deleteCount} channels(s).`;
                    } catch {
                        failed.push(channel.channel_url);
                    }
                });

                await sleep(1000);
                await deleteChannels();
            }

            await deleteChannels();

            spinner.succeed('SendBird channels deleted.');
        }
    },
    {
        name: 'Clear Pinpoint',
        disabled: true,
        action: async (brand, stage) => {
            spinner = ora('Getting current application data...');
            spinner.start();

            const ssm = new AWS.SSM({ region: DEFAULT_REGION });
            const appParameterName = `/${stage}/pinpoint/app-id`;

            const paramResult = await ssm.getParameter({
                Name: appParameterName
            }).promise();

            const currentAppId = paramResult.Parameter.Value;

            const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });
            const currentApp = await pinpoint.getApp({
                ApplicationId: currentAppId
            }).promise();

            const currentAppSettings = await pinpoint.getApplicationSettings({
                ApplicationId: currentAppId
            }).promise();

            spinner.succeed(`Current application retrieved: ${currentAppId}`);

            spinner.start('Creating new application...');

            const newAppResult = await pinpoint.createApp({
                CreateApplicationRequest: {
                    Name: currentApp.ApplicationResponse.Name,
                    tags: currentApp.ApplicationResponse.tags
                }
            }).promise();

            const newAppId = newAppResult.ApplicationResponse.Id;

            spinner.succeed(`New application created: ${newAppId}`);
            spinner.start('Applying settings to new application...');

            await pinpoint.updateApplicationSettings({
                ApplicationId: newAppId,
                WriteApplicationSettingsRequest: {
                    CampaignHook: currentAppSettings.ApplicationSettingsResource.CampaignHook,
                    Limits: currentAppSettings.ApplicationSettingsResource.Limits,
                    QuietTime: currentAppSettings.ApplicationSettingsResource.QuietTime
                }
            }).promise();

            spinner.succeed('Application settings applied.');

            const channels = await pinpoint.getChannels({
                ApplicationId: currentAppId
            }).promise();

            for (const channel of Object.keys(channels.ChannelsResponse.Channels)) {
                switch(channel) {
                    case 'EMAIL':
                        spinner.start('Setting up email channel...');
                        const currentEmailChannel = await pinpoint.getEmailChannel({
                            ApplicationId: currentAppId
                        }).promise();
                        await pinpoint.updateEmailChannel({
                            ApplicationId: newAppId,
                            EmailChannelRequest: {
                                FromAddress: currentEmailChannel.EmailChannelResponse.FromAddress,
                                Identity: currentEmailChannel.EmailChannelResponse.Identity,
                                Enabled: currentEmailChannel.EmailChannelResponse.Enabled,
                                RoleArn: currentEmailChannel.EmailChannelResponse.RoleArn
                            }
                        }).promise();
                        spinner.succeed('Email channel setup complete.');
                        break;

                    case 'SMS':
                        spinner.start('Setting up SMS channel...');
                        const currentSmsChannel = await pinpoint.getSmsChannel({
                            ApplicationId: currentAppId
                        }).promise();
                        await pinpoint.updateSmsChannel({
                            ApplicationId: newAppId,
                            SMSChannelRequest: {
                                SenderId: currentSmsChannel.SMSChannelResponse.SenderId,
                                ShortCode: currentSmsChannel.SMSChannelResponse.ShortCode,
                                Enabled: currentSmsChannel.SMSChannelResponse.Enabled
                            }
                        }).promise();
                        spinner.succeed('SMS channel setup complete.');
                        break;
                }
            }

            spinner.start('Updating SSM parameter with new application ID...');
            await ssm.putParameter({
                Name: appParameterName,
                Value: newAppId
            }). promise();
            spinner.succeed('SSM parameter updated.');

            spinner.start('Deleting old application...');
            await pinpoint.deleteApp({
                ApplicationId: currentAppId
            }).promise();
            spinner.succeed('Old application deleted.');
        }
    },
    {
        name: 'Clear Database',
        action: async (brand, stage) => {
            shelljs.exec(`yarn db schema:drop --brand ${brand} --stage ${stage}`);
        }
    },
    {
        name: 'Clear Redis',
        skipOnError: true,
        regional: true,
        action: async (region, brand, stage) => {
            spinner = ora('Please wait...');
            spinner.start();

            const lambdaName = `system-utility-${stage}-clearRedis`;

            const lambda = new AWS.Lambda({ region });
            const payload = {
                pattern: '*'
            };
            await lambda.invoke({ FunctionName: lambdaName, Payload: JSON.stringify(payload) }).promise();
            spinner.succeed('Redis cleared.');
        }
    },
    {
        name: 'Clear Tournament SQS Queues',
        feature: "tournaments",
        regional: true,
        action: async (region) => {
            const sqs = new AWS.SQS({ region });

            const result = await sqs.listQueues({ QueueNamePrefix: 'tournament-' }).promise();
            if (!result.QueueUrls || result.QueueUrls.length === 0) {
                colog.info('No queues found.');
                return;
            }

            spinner = ora('Please wait...');
            spinner.start();

            for (const url of result.QueueUrls)
                await sqs.deleteQueue({ QueueUrl: url }).promise();

            spinner.succeed('Tournament SQS queues cleared.');
        }
    },
    {
        name: 'Clear Custom Avatars',
        skipOnError: true,
        action: async (brand, stage) => {
            spinner = ora('Deleting...');
            spinner.start();

            const bucket = `origin.content.${brand}.${stage}.tgaming.io`;
            await emptyS3Bucket(bucket, 'avatars/custom/');

            spinner.succeed('Custom Avatars cleared.');
        }
    },
    {
        name: 'Clear Verification Files',
        skipOnError: true,
        action: async (brand, stage) => {
            spinner = ora('Deleting...');
            spinner.start();

            const bucket = `io.tgaming.${stage}.${brand}.players`;
            await emptyS3Bucket(bucket);

            spinner.succeed('Verification Files cleared.');
        }
    },
    {
        name: 'Run Database Migrations',
        action: async (brand, stage) => {
            const result = shelljs.exec(`yarn db migration:run --brand ${brand} --stage ${stage}`);
            
            if (result.stderr)
                throw new Error(result.stderr);
        }
    },
    {
        name: 'Run Database Seeds',
        action: async (brand, stage) => {
            const result = shelljs.exec(`yarn db seed:run --brand ${brand} --stage ${stage}`);

            if (result.stderr)
                throw new Error(result.stderr);
        }
    },
    {
        name: 'Check Third Parties',
        action: async () => {
            const go = await select.confirm('Please check third parties have all be reset. Do you want to continue?', false);

            if (!go) {
                colog.info('Exiting.');
                process.exit(0);
            }
        }
    },
    {
        name: 'Start Scheduled Lambdas',
        regional: true,
        action: async (region) => {
            const cwe = new AWS.CloudWatchEvents({ region: region });
            const rules = await cwe.listRules().promise();
            colog.progress(0, rules.Rules.length);

            for (const rule of rules.Rules) {
                await cwe.enableRule({ Name: rule.Name }).promise();
                colog.progress();
            }
        }
    },
    {
        name: 'Start Bot Service',
        feature: "tournaments",
        regional: true,
        action: async (region) => {
            const cluster = 'tournament-cluster';
            const ecs = new AWS.ECS({ region });
            const services = await ecs.listServices({ cluster, launchType: 'FARGATE' }).promise();

            if (services.serviceArns.length === 0) {
                colog.warning('No services found.');
                return;
            }

            const result = await ecs.describeServices({ cluster, services: services.serviceArns }).promise();
            const botService = result.services.find(s => s.serviceName === 'TournamentBots');

            if (!botService) {
                colog.warning('Bot service not found.');
                return;
            }

            await ecs.updateService({ cluster, service: botService.serviceName, desiredCount: 1 }).promise();
            colog.success('Bot service started.');
        }
    }
]

module.exports = async function reset(brand, stage, options) {
    if (!['dev', 'uat'].includes(stage)) {
        colog.error(`${stage} is not a valid stage value.`);
        process.exit(1);
        return;
    }

    if (options.step && options.from) {
        colog.error('Cannot have "step" and "from" options set at the same time.');
        process.exit(1);
        return;
    }

    let stepsToRun = steps;

    if (options.step)
        stepsToRun = steps.filter(s => s.name === options.step);
    else if (options.from) {
        const stepIndex = steps.findIndex(s => s.name === options.from);

        if (stepIndex === -1) {
            colog.error(`Could not find step '${options.from}'.`);
            process.exit(1);
            return;
        }

        stepsToRun = steps.slice(stepIndex);
    }

    colog.warning(`WARNING: This tool will completely reset the ${brand} ${stage} environment.`);
    const answer = await select.confirm('Are you sure you want to continue?', false);

    if (!answer) {
        colog.info('Aborting...');
        process.exit(0);
    }

    await setupAWS(brand, stage);
    const brandFeatures = await getFeatures(brand, stage);

    for (const step of stepsToRun) {
        if ([options.step, options.from].includes(step.name) && step.condition && !options[step.condition]) {
            colog.error(`The '${step.name}' step requires the '${step.condition}' option to be supplied.`);
            process.exit(1);
            return;
        }

        if (step.condition && !options[step.condition])
            continue;

        if (step.feature && !brandFeatures.includes(step.feature))
            continue;

        colog.headerInfo(`${step.name}`);

        if (step.disabled) {
            colog.warning('Step disabled, skipping.');
            continue;
        }

        try {
            if (step.regional) {
                for (const region of regions) {
                    colog.info(colog.bold(`---- ${region} ----`));
                    await step.action(region, brand, stage, options);
                }
            } else {
                await step.action(brand, stage, options);
            }
        } catch (err) {
            if (spinner)
                spinner.stop();

            if (step.skipOnError) {
                colog.warning(err);
                continue;
            }

            throw err;
        }
    }

    colog.info(divider);
    colog.success(`Reset of ${brand} ${stage} environment complete.`);
}