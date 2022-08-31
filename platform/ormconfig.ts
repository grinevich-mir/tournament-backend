import * as env from 'env-var';
import { CustomNamingStrategy } from './src/core/db/orm';
import { ConnectionOptions } from 'typeorm';

const config = env.get('DB_CONFIG').required().asJsonObject() as any;

const options: ConnectionOptions[] = [];
const namingStrategy = new CustomNamingStrategy();

Object.keys(config.connections).map(key => {
    const connection = config.connections[key];
    const option: ConnectionOptions = {
        name: key,
        type: 'mysql',
        host: '127.0.0.1',
        username: connection.username,
        password: connection.password,
        database: connection.database,
        port: connection.port,
        entities: connection.orm.entities,
        migrationsTableName: connection.orm.migrationsTableName || '_migrations',
        migrations: connection.orm.migrations,
        namingStrategy,
        cli: {
            migrationsDir: connection.orm.migrationsDir
        }
    };
    options.push(option);
});

export = options;