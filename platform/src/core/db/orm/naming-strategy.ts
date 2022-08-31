import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'lodash';

export class CustomNamingStrategy extends DefaultNamingStrategy {
    public name?: string | undefined = 'Custom';

    constructor() {
        super();
    }

    public tableName(targetName: string, userSpecifiedName: string | undefined): string {
        return super.tableName(targetName.replace('Entity', ''), userSpecifiedName);
    }

    public joinTableName(firstTableName: string,
                         secondTableName: string,
                         firstPropertyName: string,
                         secondPropertyName: string): string {
        return snakeCase(firstTableName + '_' + secondTableName);
    }
}