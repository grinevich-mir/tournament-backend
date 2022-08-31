import { ValueTransformer } from 'typeorm';

export class NumericTransformer implements ValueTransformer {
    constructor(private nullable: boolean = false) {
    }

    public to(data?: number): number | null {
        if (data === undefined || data === null)
            return this.nullable ? null : 0;

        return data;
    }

    public from(data?: string): number | null {
        if (data === undefined || data === null)
            return this.nullable ? null : 0;

        const res = parseFloat(data);
        if (isNaN(res))
            return this.nullable ? null : 0;
        else
            return res;
    }
}