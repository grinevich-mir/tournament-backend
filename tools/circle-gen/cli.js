#! /usr/bin/env node

const delimiters = require('handlebars-delimiters');
const Handlebars = require('handlebars');
const fs = require('fs');
const findUp = require('find-up');
const filterPackages = require('@tools/common/filter-packages');
const slugify = require('slugify');
const minimatch = require('minimatch');

process.on('unhandledRejection', (err) => {
    if (err instanceof Error) {
        console.error(err.message);
        return;
    }

    console.error(err);
});

Handlebars.registerHelper('iff', function(a, operator, b, opts) {
    var bool = false;
    switch(operator) {
       case '==':
           bool = a == b;
           break;
        case '!==':
            bool = a !== b;
            break;
       case '>':
           bool = a > b;
           break;
       case '<':
           bool = a < b;
           break;
       default:
           throw "Unknown operator " + operator;
    }
 
    if (bool) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

Handlebars.registerHelper('ifIn', function(elem, list, options) {
    if(list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

delimiters(Handlebars, ['<%', '%>']);

function groupDeployables(deployables) {
    const groups = [];
    const errors = [];
    let previousMap = {
    };

    for (const deployable of deployables) {
        if (!deployable.feature && !deployable.integration) {
            errors.push(`Package ${deployable.package} does not have the @feature or @integration properties set.`);
            continue;
        }

        let groupName = 'default';

        if (deployable.feature)
            groupName = `feat-${deployable.feature}`;
        else if (deployable.integration)
            groupName = `integr-${deployable.integration}`;

        let group = groups.find(g => g.name === groupName);

        if (!group) {
            group = { name: groupName, deployables: [] };
            groups.push(group);
        }

        if (previousMap[groupName])
            deployable.previous = previousMap[groupName];

        deployable.first = group.deployables[0];

        group.deployables.push(deployable);

        previousMap[groupName] = deployable;
    }

    if (errors && errors.length > 0) {
        let message = `The following errors occurred:\n`
        message += errors.map(e => ` - ${e}`).join('\n');
        throw new Error(message);
    }

    return groups;
}

async function buildConfigs() {
    const configs = [];

    const brandsFile = await findUp('brands.json');
    const brands = require(brandsFile);

    for (const brand of Object.keys(brands)) {
        const config = {
            brand,
            name: brands[brand].name,
            regions: [brands[brand].regions.primary],
            primaryRegion: brands[brand].regions.primary
        };
    
        if (brands[brand].regions.secondary && brands[brand].regions.secondary.length > 0)
            config.regions.push(...brands[brand].regions.secondary);

        const packages = await filterPackages('deploy', brand);

        config.deployables = packages.map(p => {
            return {
                name: slugify(p.name.replace('@', '').replace('/', '-').replace('tcom-', '')),
                feature: p.get('@feature'),
                integration: p.get('@integration'),
                package: p.name,
                location: p.location.replace(p.rootPath + '/', ''),
                regions: minimatch(p.name, '@tcom/service-{management,integration}-*') ? [config.primaryRegion] : config.regions,
                useDocker: '@tools/aws-docker' in p.dependencies || '@tools/aws-docker' in p.devDependencies
            }
        });

        config.groups = groupDeployables(config.deployables);

        configs.push(config);
    }

    return configs;
}

async function main() {
    console.log('Generating Circle CI configuration...');
    
    const data = await buildConfigs();    
    const template = fs.readFileSync('.circleci/config.yml.tpl', { encoding: 'utf-8' });    
    const result = Handlebars.compile(template)(data);    
    fs.writeFileSync('.circleci/config.yml', result, { encoding: 'utf-8' });
    
    console.log('Circle CI configuration generated.');
}

main();