const prompts = require('prompts');
const colog = require('colog');
const { getBrands, getStages, getSkins, getRegions, getBrandConfig, getBrandConfigs } = require('./index');

const brand = async (label) => {
    label = label ? `${label} Brand` : 'Brand';

    const brands = await getBrands();

    const choices = brands.map(b => {
        return {
            value: b.id,
            title: b.name
        }
    });

    const response = await prompts({
        message: label,
        type: 'select',
        name: 'value',
        choices,
        initial: 0
    });

    if (!response.value) {
        console.log('Cancelled.');
        process.exit(0);
    }

    return response.value;
};

const stage = async (brand, label) => {
    label = label ? `${label} Stage` : 'Stage';

    const stages = await getStages(brand);

    const choices = stages.map(s => {
        return {
            value: s,
            title: s
        }
    });

    const response = await prompts({
        message: label,
        type: 'select',
        name: 'value',
        choices,
        initial: 0
    });

    if (!response.value) {
        console.log('Cancelled.');
        process.exit(0);
    }

    return response.value;
};

const skin = async (brand, label) => {
    label = label ? `${label} Skin` : 'Skin';

    const skins = await getSkins(brand);

    const choices = skins.map(s => {
        return {
            value: s.id,
            title: s.name
        }
    });

    const response = await prompts({
        message: label,
        type: 'select',
        name: 'value',
        choices,
        initial: 0
    });

    if (!response.value) {
        console.log('Cancelled.');
        process.exit(0);
    }

    return response.value;
};

const region = async (brand, label) => {
    label = label ? `${label} Region` : 'Region';

    let regions = await getRegions(brand);

    if (!regions || regions.length === 0)
        throw new Error('No regions available.');

    if (regions.length === 1) {
        console.log(`${colog.green('✔')} ${colog.bold(label)} › ${regions[0]}`);
        return regions[0];
    }

    const choices = regions.map(r => {
        return {
            value: r,
            title: r
        }
    });

    const response = await prompts({
        message: label,
        type: 'select',
        name: 'value',
        choices,
        initial: 0
    });

    if (!response.value) {
        console.log('Cancelled.');
        process.exit(0);
    }

    return response.value;
};

const checkBrand = async (brand) => {
    await getBrandConfig(brand);
};

const checkStage = async (brand, stage) => {
    const brandsConfig = await getBrandConfigs();
    
    if (!brandsConfig[brand])
        throw new Error(`Brand '${brand}' does not exist in config.`);

    if (!brandsConfig[brand].stages[stage])
        throw new Error(`Stage '${stage}' does not exist for brand '${brand}' in config.`);
};

const checkSkin = async (brand, skin) => {
    const brandsConfig = await getBrandConfigs();
    
    if (!brandsConfig[brand])
        throw new Error(`Brand '${brand}' does not exist in config.`);

    if (!brandsConfig[brand].skins[skin])
        throw new Error(`Skin '${skin}' does not exist for brand '${brand}' in config.`);
};

const check = async (data) => {
    if (data.brand)
        await checkBrand(data.brand);
    if (data.stage)
        await checkStage(data.brand, data.stage);
    if (data.skin)
       await checkSkin(data.brand, data.skin);
};

exports.prompt = async (data, options) => {
    await check(data);

    if (!data.brand)
        data.brand = await brand();
    if (!data.stage)
        data.stage = await stage(data.brand);
    if (!data.skin && options && options.skin)
        data.skin = await skin(data.brand);
    if (!data.region && options && options.region)
        data.region = await region(data.brand);
};

exports.check = check;
exports.region = region;
exports.brand = brand;
exports.stage = stage;
exports.skin = skin;
exports.confirm = async (message, initial) => {
    const response = await prompts({
        type: 'confirm',
        name: 'value',
        message,
        initial
    });

    if (response.value === undefined) {
        console.log('Cancelled.');
        process.exit(0);
    }

    return response.value;
};
exports.number = async (message, initial) => {
    const response = await prompts({
        type: 'number',
        name: 'value',
        message,
        initial
    });

    if (response.value === undefined) {
        console.log('Cancelled.');
        process.exit(0);
    }

    return response.value;
};
exports.multi = async (message, choices) => {
    const response = await prompts({
        type: 'multiselect',
        name: 'value',
        message,
        choices
    });

    if (response.value === undefined) {
        console.log('Cancelled.');
        process.exit(0);
    }

    return response.value;
};