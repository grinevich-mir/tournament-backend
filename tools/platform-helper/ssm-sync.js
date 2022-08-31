const AWS = require('aws-sdk');
const colog = require('colog');
const ora = require('ora');
const select = require('@tools/common/selection');
const { getBrandConfig } = require('@tools/common');
const prompts = require('prompts');

let spinner = new ora();

const EXCLUSIONS = [

];

async function listParameters(ssm) {
    let nextToken;
    const parameters = [];

    while (true) {
        const result = await ssm.describeParameters({
            NextToken: nextToken
        }).promise();

        if (!result.Parameters || result.Parameters.length === 0)
            break;

        parameters.push(...result.Parameters);

        if (!result.NextToken)
            break;

        nextToken = result.NextToken;
    }

    return parameters;
}

async function getSSM(target) {
    const brandConfig = await getBrandConfig(target.brand, target.stage);
    var credentials = new AWS.SharedIniFileCredentials({ profile: brandConfig.aws.profile });
    return new AWS.SSM({ region: target.region, credentials });
}

module.exports = async function(source, target) {
    const overwrite = false;

    try {
        const sourceSSM = await getSSM(source);
        const targetSSM = await getSSM(target);

        spinner.start(`Getting SSM parameters from source...`);
        let sourceParams = await listParameters(sourceSSM);

        if (sourceParams.length === 0) {
            colog.warning(`No parameters found on source!`);
            return;
        }

        if (!overwrite) {
            spinner.text = 'Getting SSM parameters from target...';
            const targetParams = await listParameters(targetSSM);
            const existing = targetParams.map(p => p.Name);
            sourceParams = sourceParams.filter(sp => {
                const targetName = sp.Name.replace(`/${source.stage}/`, `/${target.stage}/`);
                return !existing.includes(targetName)
            });
        }

        spinner.stop();

        colog.info('The following parameters will be copied over to the target:');
        sourceParams = await select.multi('Parameters to copy', sourceParams.map(sp => ({
            title: sp.Name,
            value: sp,
            selected: true
        })));

        console.log();

        if (sourceParams.length === 0) {
            colog.info('No parameters to copy.');
            return;
        }

        colog.info('The following parameters will be copied:');
        for (const param of sourceParams)
            colog.info(`* ${param.Name}`);

        console.log();
        const answer = await select.confirm('Are you sure you want to continue?', false);

        if (!answer) {
            colog.info('Aborting...');
            process.exit(0);
        }

        let copiedCount = 0;

        spinner.start();

        for (const sourceParam of sourceParams) {
            const targetName = sourceParam.Name.replace(`/${source.stage}/`, `/${target.stage}/`);
            const result = await sourceSSM.getParameter({ Name: sourceParam.Name, WithDecryption: sourceParam.Type === 'SecureString' }).promise();

            if (targetName === sourceParam.Name)
                spinner.text = `Copying ${sourceParam.Name}...`;
            else
                spinner.text = `Copying ${sourceParam.Name} to ${targetName}...`;

            const parameter = result.Parameter;

            try {
                const param = { 
                    Name: targetName,
                    Type: sourceParam.Type,
                    KeyId: sourceParam.KeyId,
                    Tier: sourceParam.Tier,
                    Policies: sourceParam.Policies && sourceParam.Policies.length > 0 ? JSON.stringify(sourceParam.Policies) : undefined,
                    Description: sourceParam.Description,
                    AllowedPattern: sourceParam.AllowedPattern,
                    Value: parameter.Value,
                    Overwrite: overwrite
                };

                await targetSSM.putParameter(param).promise();
                copiedCount++;
            } catch {
            }
        }

        spinner.succeed(`${copiedCount} SSM parameter(s) copied.`);

    } finally {
        if (spinner.isSpinning)
            spinner.stop();
    }
};