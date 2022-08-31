const Project = require('@lerna/project');
const minimatch = require('minimatch');
const { getBrandConfig } = require('@tools/common');

async function filterPackages(command, brand, scope, ignore) {
    const project = new Project(process.cwd());
    const packages = await project.getPackages();
    
    const brandConfig = await getBrandConfig(brand);

    let filteredPackages = packages.filter(p => {
        if (p.name.startsWith('@tools/'))
            return false;

        if (['backend', 'serverless-plugin-enabled', '@docs/service'].includes(p.name))
            return false;

        if (!(command in p.scripts))
            return false;

        if (!brandConfig)
            return true;

        const feature = p.get('@feature');
        const integration = p.get('@integration');

        if (!feature && !integration)
            return true;

        if (feature)
            return brandConfig.features[feature] === undefined || brandConfig.features[feature] === true;

        if (integration)
            return brandConfig.integrations[integration] === undefined || brandConfig.integrations[integration] === true;
    });

    if (scope)
        filteredPackages = filteredPackages.filter(p => minimatch(p.name, scope));

    if (ignore)
        filteredPackages = filteredPackages.filter(p => !minimatch(p.name, ignore));

    return filteredPackages;
}

module.exports = filterPackages;