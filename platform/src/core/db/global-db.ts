import { Singleton, Inject } from '../ioc';
import { DbConfig } from './db-config';
import * as env from 'env-var';
import { Connection } from 'typeorm';
import { ConnectionManager } from './connection-manager';
import _ from 'lodash';
import { ParameterStore } from '../parameter-store';
import { Config } from '../config';
import { DEFAULT_REGION } from '../regions';
import { LogClass } from '../logging';

@Singleton
@LogClass({ result: false })
export class GlobalDB {
    private entities!: any[];

    constructor(
        @Inject private readonly manager: ConnectionManager,
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async getConnection(): Promise<Connection> {
        const username = env.get('DB_GLOBAL_USERNAME').required().asString();
        const password = await this.getPassword(username);

        const config: DbConfig = {
            name: env.get('DB_GLOBAL_NAME').required().asString(),
            username,
            password,
            port: env.get('DB_GLOBAL_PORT', '3306').asIntPositive(),
            host: env.get('DB_GLOBAL_WR_ENDPOINT').required().asString(),
            entities: this.getEntities()
        };

        if (Config.region !== DEFAULT_REGION)
            config.slaveHosts = [
                env.get('DB_GLOBAL_RO_ENDPOINT').required().asString()
            ];

        return this.manager.getConnection('Global', config);
    }

    private getEntities(): any[] {
        if (this.entities)
            return this.entities;

        const contexts = require.context('../../', true, /entities\/[a-zA-Z0-9-]+\.entity.js$/);
        const entityModules = contexts
            .keys()
            .map(modulePath => contexts(modulePath));
        const entities = _.flatMap(entityModules, (entityModule) => Object.keys(entityModule).map(key => entityModule[key]));
        this.entities = entities;
        return entities;
    }

    private async getPassword(username: string): Promise<string> {
        const key = `/${Config.stage}/rds/global/${username}/password`;
        return this.parameterStore.get(key, true, true);
    }
}