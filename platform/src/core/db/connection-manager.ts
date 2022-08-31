import { Connection, getConnectionManager, createConnection, ConnectionManager as TypeOrmConnectionManager } from 'typeorm';
import { MysqlDriver } from 'typeorm/driver/mysql/MysqlDriver';
import { DbConfig } from './db-config';
import { Singleton, Inject } from '../ioc';
import { MysqlConnectionCredentialsOptions } from 'typeorm/driver/mysql/MysqlConnectionCredentialsOptions';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { CustomNamingStrategy } from './orm/naming-strategy';
import _ from 'lodash';
import { Redis } from '../redis';
import Logger, { LogClass } from '../logging';
import { retry } from '../utilities';

const RETRY_CONN_ERRORS = [
    'ER_TOO_MANY_USER_CONNECTIONS',
    'ER_CON_COUNT_ERROR',
    'ER_USER_LIMIT_REACHED',
    'ER_OUT_OF_RESOURCES',
    'ER_CON_COUNT_ERROR',
    'PROTOCOL_CONNECTION_LOST', // if the connection is lost
    'PROTOCOL_SEQUENCE_TIMEOUT', // if the connection times out
    'ETIMEDOUT', // if the connection times out
    'EAI_AGAIN', // DNS error
    'ENOTFOUND' // DNS error
];

@Singleton
@LogClass({ result: false, arguments: false })
export class ConnectionManager {
    private readonly namingStrategy = new CustomNamingStrategy();
    private readonly manager: TypeOrmConnectionManager;

    public static async closeAll(): Promise<void> {
        const manager = getConnectionManager();

        if (!manager.connections || manager.connections.length === 0)
            return;

        Logger.info(`Closing ${manager.connections.length} DB connection(s)...`);

        for (const conn of manager.connections)
            try {
                const mysqlDriver = conn.driver as MysqlDriver;
                if (mysqlDriver && mysqlDriver.poolCluster) {
                    mysqlDriver.poolCluster.end();
                    Object.assign(conn, { isConnected: false });
                } else
                    await conn.close();
            } catch (err) {
                Logger.warn(`Failed closing ${conn.name} connection`, { error: err });
            } finally {
                manager.connections.splice(manager.connections.indexOf(conn), 1);
            }
    }

    constructor(
        @Inject private readonly redis: Redis) {
        this.manager = getConnectionManager();
    }

    public async getConnection(name: string, config: DbConfig): Promise<Connection> {
        let connection: Connection;

        if (this.manager.has(name)) {
            connection = this.manager.get(name);

            try {
                if (!connection.isConnected)
                    await connection.connect();

                return connection;
            } catch (err) {
                Logger.warn(`Failed to use existing '${name}' connection:`, err);
                this.manager.connections.splice(this.manager.connections.indexOf(connection), 1);
            }
        }

        Logger.info(`Creating '${name}' connection...`);
        connection = await retry(async () => this.createConnection(name, config), 50, {
            shouldRetry: (err: Error) => this.isRetryable(err),
            onRetry: (err, retryCount) => Logger.warn(`Database '${name}' connection failed, retry ${retryCount}/50: ${err.message}`),
            onSuccess: (retryCount, totalTime) => {
                if (retryCount === 0)
                    return;

                Logger.error(`Database '${name}' Connection succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
            }
        });

        return connection;
    }

    private async createConnection(name: string, config: DbConfig): Promise<Connection> {
        let options: MysqlConnectionOptions;

        const defaults: MysqlConnectionOptions = {
            name,
            ssl: 'Amazon RDS',
            type: 'mysql',
            logging: ['error'],
            namingStrategy: this.namingStrategy,
            entities: config.entities,
            cache: {
                type: 'ioredis/cluster',
                options: this.redis.getClusterNodes()
            },
            extra: {
                connectionLimit: 1
            },
            connectTimeout: 2000
        };

        if (config.slaveHosts && config.slaveHosts.length > 0) {
            const master = this.createConnectionOptions(config);
            const slaveConnections: MysqlConnectionCredentialsOptions[] = [];
            for (const slave of config.slaveHosts) {
                const slaveOptions = this.createConnectionOptions(Object.assign({}, config, slave));
                slaveConnections.push(slaveOptions);
            }

            options = {
                type: 'mysql',
                replication: {
                    master,
                    slaves: slaveConnections
                }
            };
        } else
            options = this.createConnectionOptions(config);

        options = Object.assign({}, defaults, options);

        return createConnection(options);
    }

    private createConnectionOptions(config: DbConfig): MysqlConnectionOptions {
        return {
            type: 'mysql',
            database: config.name,
            username: config.username,
            password: config.password,
            port: config.port,
            host: config.host
        };
    }

    private isRetryable(err: Error): boolean {
        const error = err as any;
        return error.code && RETRY_CONN_ERRORS.includes(error.code);
    }
}