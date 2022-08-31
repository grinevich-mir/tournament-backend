export type Region = 'us-east-1';

interface RegionInfo {
    countryCodes: string[];
}

type RegionMap = {
    [key in Region]: RegionInfo;
};

const regionMap: RegionMap = {
    'us-east-1': {
        countryCodes: []
    }
};

export const DEFAULT_REGION: Region = 'us-east-1';
export const SUPPORTED_REGIONS: Region[] = Object.keys(regionMap) as Region[];

const mappedCountryCodes: string[] = [];

for (const region of Object.keys(regionMap) as Region[]) {
    const countryCodes = regionMap[region].countryCodes;
    mappedCountryCodes.push(...countryCodes);
}

export function fromCountry(countryCode: string): Region {
    for (const region of Object.keys(regionMap) as Region[]) {
        const countryCodes = regionMap[region].countryCodes;

        if (countryCodes.indexOf(countryCode) > -1)
            return region;
    }

    return DEFAULT_REGION;
}