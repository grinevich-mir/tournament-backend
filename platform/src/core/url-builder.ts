import { URL, URLSearchParams } from 'url';

export class URLBuilder {
    private readonly base!: URL;
    private params: URLSearchParams = new URLSearchParams();

    constructor(rawURL: string) {
        try {
            this.base = new URL(rawURL);
            if (this.base.search)
                this.params = new URLSearchParams(this.base.search.slice(1));
        } catch (e) {
            console.error('Could not parse URL', e);
        }
    }

    public appendQueryParam(name: string, value: any): this {
        this.params.append(name, value ? value.toString() : '');
        return this;
    }

    public clearQueryParams(): this {
        this.params = new URLSearchParams();
        return this;
    }

    public deleteQueryParam(name: string): this {
        this.params.delete(name);
        return this;
    }

    public getBase(): URL {
        return this.base;
    }

    public getPath(): string {
        return this.base.pathname;
    }

    public getHostname(): string {
        return this.base.hostname;
    }

    public getParams() {
        return this.params;
    }

    public getQueryParam(name: string): string | undefined {
        if (!this.params)
            return '';

        const value = this.params.get(name);
        return (!value || value === 'undefined' || value === 'null') ? undefined : value;
    }

    public getQueryString(): string {
        return this.params.toString();
    }

    public setPath(path: string): this {
        this.base.pathname = path;
        return this;
    }

    public setQueryParam(name: string, value: any): this {
        this.params.set(name, value ? value.toString() : '');
        return this;
    }


    public setQueryParams(params: { [key: string]: any }): this {
        for (const key of Object.keys(params))
            this.setQueryParam(key, params[key]);
        return this;
    }

    public setQueryString(value: string): this {
        if (!value)
            return this;

        if (value[0] === '?')
            value = value.slice(1);

        this.params = new URLSearchParams(value);
        return this;
    }

    public toString(): string {
        const queryString = this.params.toString();

        if (queryString === '')
            this.base.search = '';
        else
            this.base.search = '?' + queryString;

        return this.base.toString();
    }
}