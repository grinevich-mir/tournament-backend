declare module '@tools/common' {
    export interface Brand {
        id: string;
        name: string;
    }

    export interface Skin {
        id: string;
        name: string;
    }

    export interface BrandConfig {
        name: string;
        regions: {
            primary: string;
            secondary?: string;
        },
        skins: {
            [key: string]: {
                name: string;
            }
        },
        stages: {
            [key: string]: {
                domain: string;
                aws: {
                    accountId: number;
                    profile: string;
                },
                admin: {
                    cognito: {
                        userPoolId: string;
                        clientId: string;
                    }
                },
                skins: {
                    [key: string]: {
                        domain: string;
                        cognito: {
                            userPoolId: string;
                            clientId: string;
                        }
                    }
                }
            }
        },
        features: {
            [key: string]: boolean;
        },
        integrations: {
            [key: string]: boolean;
        }
    }

    export interface BrandStageConfig {
        name: string;
        stage: string;
        regions: {
            primary: string;
            secondary?: string;
        },
        domain: string;
        aws: {
            accountId: number;
            profile: string;
        },
        admin: {
            cognito: {
                userPoolId: string;
                clientId: string;
            }
        },
        skins: {
            [key: string]: {
                name: string;
                domain: string;
                cognito: {
                    userPoolId: string;
                    clientId: string;
                }
            }
        },
        features: {
            [key: string]: boolean;
        },
        integrations: {
            [key: string]: boolean;
        }
    }

    export interface BrandConfigs {
        [brand: string]: BrandConfig;
    }

    export function getBrandConfigs(): Promise<BrandConfigs>;
    export function getBrandConfig(brand: string, stage: string): Promise<BrandStageConfig>;
    export function getBrands(): Promise<Brand[]>;
    export function getStages(brand: string): Promise<string[]>;
    export function getSkins(brand: string): Promise<Skin>;
    export function getRegions(brand: string): Promise<string[]>;
}