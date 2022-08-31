const findUp = require('find-up');
const loadJsonFile = require('load-json-file');
const merge = require('deepmerge');

const getBrandConfigs = async () => {
    const brandsFile = await findUp('brands.json');
    return await loadJsonFile(brandsFile);
}

const getBrandConfig = async (brand, stage) => {
    const brandConfigs = await getBrandConfigs();
    let brandConfig = brandConfigs[brand];

    if (!brandConfig)
        return undefined;

    if (stage) {
        const stageConfig = brandConfig.stages[stage];

        if (!stageConfig)
            throw new Error(`Stage config '${stage}' for brand '${brand}' not found.`);

        brandConfig = merge(brandConfig, stageConfig);
        delete brandConfig.stages;
        brandConfig.stage = stage;
    }

    return brandConfig;
}

exports.getBrands = async () => {
    const brandConfigs = await getBrandConfigs();
    return Object.keys(brandConfigs).map(b => {
        return {
            id: b,
            name: brandConfigs[b].name
        }
    });
};

exports.getStages = async (brand) => {
    const brandConfigs = await getBrandConfigs();
    const brandConfig = brandConfigs[brand];

    if (!brandConfig)
        throw new Error('Brand config not found.');

    return Object.keys(brandConfig.stages);
};

exports.getSkins = async (brand) => {
    const brandConfig = await getBrandConfig(brand);
    return Object.keys(brandConfig.skins).map(s => {
        return {
            id: s,
            name: brandConfig.skins[s].name
        }
    });
};

exports.getRegions = async (brand) => {
    const brandConfigs = await getBrandConfigs();
    const brandConfig = brandConfigs[brand];

    if (!brandConfig)
        throw new Error('Brand config not found.');

    const regions = [brandConfig.regions.primary];

    if (brandConfig.regions.secondary)
        regions.push(...brandConfig.regions.secondary);

    return regions;
};

exports.getBrandConfigs = getBrandConfigs;
exports.getBrandConfig = getBrandConfig;