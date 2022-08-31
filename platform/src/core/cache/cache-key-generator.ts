export class CacheKeyGenerator {
    constructor(private readonly prefix: string) {
    }

    public generate(...params: any[]): string {
        let parameters = [this.prefix];

        if (params.length > 0 && params.every(p => p !== undefined))
            parameters = parameters.concat(params);

        return parameters.join(':');
    }
}