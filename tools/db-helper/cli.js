#! /usr/bin/env node
require('ts-node/register');
require('tsconfig-paths/register');
const program = require('commander');
const colog = require('colog');
const loadJson = require('load-json-file');
const tunnel = require('tunnel-ssh');
const fs = require('fs');
const untildify = require('untildify');
const columnify = require('columnify');
const minimatch = require('minimatch');
const AWS = require('aws-sdk');
const select = require('@tools/common/selection');
const { getBrandConfig } = require('@tools/common');
const { MigrationCreateCommand } = require('typeorm/commands/MigrationCreateCommand');
const { MigrationGenerateCommand } = require('typeorm/commands/MigrationGenerateCommand');
const { MigrationRunCommand } = require('typeorm/commands/MigrationRunCommand');
const { MigrationRevertCommand } = require('typeorm/commands/MigrationRevertCommand');
const { MigrationShowCommand } = require('typeorm/commands/MigrationShowCommand');
const { SchemaSyncCommand } = require('typeorm/commands/SchemaSyncCommand');
const { SchemaLogCommand } = require('typeorm/commands/SchemaLogCommand');
const { SchemaDropCommand } = require('typeorm/commands/SchemaDropCommand');
const { QueryCommand } = require('typeorm/commands/QueryCommand');
const generator = require('generate-password');
const mysql = require('mysql2/promise');

// TODO: SPLIT INTO SEPARATE COMMAND FILES
const defaultRegion = 'us-east-1';

function startTunnel(config) {
    const privateKey = fs.readFileSync(untildify(config.ssh.keyFile));

    const tnlConfig = {
        username: 'ec2-user',
        host: config.ssh.host,
        port: 22,
        dstHost: config.db.host,
        dstPort: config.ssh.toPort,
        localPort: config.ssh.fromPort,
        localHost: '127.0.0.1',
        privateKey,
        keepAlive: false
    };

    console.log('Starting tunnel...');

    return new Promise((resolve, reject) => {
        const tnl = tunnel(tnlConfig, (err, srv) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(tnl);
        });
    });
}

async function run(config, callback) {
    if (!config.ssh)
        return callback();

    const tunnel = await startTunnel(config);

    try {
        return callback();
    } catch {
        tunnel.close();
    }
}

function summary(header, name, connection) {
    colog.headerInfo(header);
    colog.info('-----------------------------------------------------------------------------------------');
    colog.info(columnify({
        Connection: colog.bold(name),
        Database: colog.bold(connection.database),
        Host: colog.bold(connection.host)
    }, { showHeaders: false, columnSplitter: ' : ' }));
    colog.info('-----------------------------------------------------------------------------------------');
}

async function createMigration(name, config, connectionName) {
    const connection = config.connections[connectionName];
    summary(`Creating migration '${name}'...`, connectionName, connection);
    const command = new MigrationCreateCommand();
    await command.handler({
        _: ['migration:create'],
        name: name,
        connection: connectionName
    });
}

async function generateMigrations(name, config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Generating migrations...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new MigrationGenerateCommand();
        await command.handler({
            _: ['migration:generate'],
            name: name,
            connection: connectionName
        });
    })
}

async function runMigrations(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Running migrations...', connectionName, connection);

    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new MigrationRunCommand();
        await command.handler({
            _: ['migration:run'],
            connection: connectionName
        });
    });
}

async function revertMigrations(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Reverting migrations...', connectionName, connection);

    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new MigrationRevertCommand();
        await command.handler({
            _: ['migration:revert'],
            connection: connectionName
        });
    });
}

async function showMigrations(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Showing migrations...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new MigrationShowCommand();
        await command.handler({
            _: ['migration:show'],
            connection: connectionName
        });
    });

    const tunnel = await startTunnel({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    });
}

async function schemaLog(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Logging schema changes...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new SchemaLogCommand();
        await command.handler({
            _: ['schema:log'],
            connection: connectionName
        });
    });
}

async function schemaSync(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Syncing schema...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new SchemaSyncCommand();
        await command.handler({
            _: ['schema:sync'],
            connection: connectionName
        });
    });
}

async function schemaDrop(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Dropping schema...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const dropCommand = new SchemaDropCommand();
        await dropCommand.handler({
            _: ['schema:drop'],
            connection: connectionName
        });

        if (!connection.events)
            return;

        for (const event of connection.events) {
            const query = `DROP EVENT IF EXISTS ${event}`;

            const queryCommand = new QueryCommand();
            await queryCommand.handler({
                _: ['query', query],
                connection: connectionName,
            });
        }
    });
}

async function createSeed(name, config, connectionName) {
    const connection = config.connections[connectionName];
    summary(`Creating migration '${name}'...`, connectionName, connection);
    const command = new MigrationCreateCommand();
    await command.handler({
        _: ['migration:create'],
        name: name,
        connection: connectionName
    });
}

async function runSeed(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Running seeds...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new MigrationRunCommand();
        await command.handler({
            _: ['migration:run'],
            connection: connectionName
        });
    });
}

async function revertSeed(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Reverting seeds...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new MigrationRevertCommand();
        await command.handler({
            _: ['migration:revert'],
            connection: connectionName
        });
    });
}

async function showSeeds(config, connectionName) {
    const connection = config.connections[connectionName];
    summary('Showing seeds...', connectionName, connection);
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        const command = new MigrationShowCommand();
        await command.handler({
            _: ['migration:show'],
            connection: connectionName
        });
    });
}

async function syncUser(user, regions, config, connection, regenerate) {
    const data = [];
    let password;

    for (const region of regions) {
        let password = null;
        const ssm = new AWS.SSM({ 
            region
        });

        try {
            const result = await ssm.getParameter({
                Name: user.ssmPasswordKey,
                WithDecryption: true
            }).promise();
            password = result.Parameter.Value;
        } catch (err) {
            if (err.code !== 'ParameterNotFound')
                if (err.message)
                    colog.error(err.message);
                else
                    throw err;
        }

        data.push({
            region,
            password
        });
    }

    let regionsToSync = [];
    const withPasswords = data.filter(d => d.password);

    if (regenerate || withPasswords.length === 0) {
        if (!regenerate)
            colog.info('No regions have SSM parameters set.');
            
        colog.info('Generating password...');
        password = generator.generate({
            length: 32,
            numbers: true,
            symbols: true,
            uppercase: true
        });
        regionsToSync = regions;
    } else {
        password = withPasswords[0].password;
        const unmatched = data.filter(d => d.password != password);

        for (const um of unmatched)
            if (regionsToSync.indexOf(um.region) === -1)
                regionsToSync.push(um.region);

        const noPassword = data.filter(d => !d.password);
        for (const np of noPassword)
            if (regionsToSync.indexOf(np.region) === -1)
                regionsToSync.push(np.region);
    }

    for (const region of regionsToSync) {
        colog.info(`Updating SSM parameters in region ${region}...`);
        const ssm = new AWS.SSM({ region });
        await ssm.putParameter({
            Name: user.ssmPasswordKey,
            Type: 'SecureString',
            Overwrite: true,
            Value: password
        }).promise();
    }

    colog.success('SSM parameters are up to date.');
    colog.info('Updating database user and permissions...');
    await run({
        ssh: config.ssh,
        db: {
            host: connection.host
        }
    }, async () => {
        let dbConn;

        try {
            dbConn = await mysql.createConnection({
                host: '127.0.0.1',
                port: connection.port,
                user: connection.username,
                password: connection.password,
                database: connection.database
            });

            const [rows] = await dbConn.query(`SELECT 1 FROM mysql.user WHERE user = '${user.username}'`);

            if (rows.length === 0) {
                colog.info('Database user does not exist, creating...');
                const sql = `CREATE USER ?@'%' IDENTIFIED BY ?;`;
                await dbConn.query(sql, [user.username, password]);
            } else {
                colog.info('Updating user password...');
                const sql = `SET PASSWORD FOR ?@'%' = PASSWORD(?);`;
                await dbConn.query(sql, [user.username, password]);
            }

            if (user.permissions && user.permissions.length > 0) {
                const privileges = user.permissions.join(', ');
                colog.info(`Granting ${privileges} privileges to '${connection.database}'...`);
                const sql = `GRANT ${privileges} ON ${connection.database}.* TO ?@'%'`;
                await dbConn.query(sql, [user.username]);
            }
        } finally {
            if (dbConn)
                dbConn.close();
        }
    });

    colog.success('Database users are up to date.');
    console.log();
}

async function syncUsers(config, connectionName, regenerate) {
    const connection = config.connections[connectionName];

    if (!connection.userSync || !connection.userSync.users)
        return;

    const regions = connection.userSync.regions;
    const users = connection.userSync.users;
    const usernames = Object.keys(users);

    summary('Synchronising users...', connectionName, connection);
    colog.info(columnify({
        Regions: colog.bold(regions.join(', ')),
        Users: colog.bold(usernames.join(', '))
    }, { showHeaders: false, columnSplitter: ' : ' }));
    colog.info('-----------------------------------------------------------------------------------------');

    for (const username of usernames) {
        colog.info(`Synchronising '${username}'...`);
        const user = Object.assign({}, users[username], { username });
        await syncUser(user, regions, config, connection, regenerate);
    }
}

function loadAWSCredentials(profile) {
    var credentials = new AWS.SharedIniFileCredentials({ profile });
    AWS.config.credentials = credentials;
}

async function loadConfig(brand, stage, scope, transformer) {
    const brandConfig = await getBrandConfig(brand, stage);

    const dbConfig = await loadJson(`database/config/${brand}.json`);
    const dbStageConfig = dbConfig[stage];

    if (!dbStageConfig)
        throw new Error(`Configuration for stage '${stage}' is missing.`);

    process.env.BRAND = brand;
    process.env.STAGE = stage;
    process.env.BRAND_CONFIG = JSON.stringify(brandConfig);

    if (dbStageConfig.variables) {
        for (const key of Object.keys(dbStageConfig.variables))
            process.env[key] = dbStageConfig.variables[key];
    }

    if (!dbStageConfig.connections)
        throw new Error('No connections found in configuration.');

    Object.keys(dbStageConfig.connections).forEach((key, i) => {
        if (dbStageConfig.connections[key].enabled === false || (scope && !minimatch(key, scope)))
            delete dbStageConfig.connections[key];
    });

    if (transformer)
        transformer(dbStageConfig);

    loadAWSCredentials(brandConfig.aws.profile);

    for (const connectionName of Object.keys(dbStageConfig.connections)) {
        const connection = dbStageConfig.connections[connectionName];
        const ssh = dbStageConfig.ssh;

        connection.port = !ssh ? 3306 : 3307;

        if (!connection.ssmPasswordKey)
            continue;

        colog.info(`Getting password for connection '${connectionName}' from SSM...`);
        const ssm = new AWS.SSM({ 
            region: defaultRegion
        });

        const result = await ssm.getParameter({
            Name: connection.ssmPasswordKey,
            WithDecryption: true
        }).promise();
        connection.password = result.Parameter.Value;
    }

    colog.success('Connection passwords retrieved.');
    process.env.DB_CONFIG = JSON.stringify(dbStageConfig);

    return dbStageConfig;
}

async function loadSeedConfig(brand, stage, scope) {
    return await loadConfig(brand, stage, scope, (config) => {
        Object.keys(config.connections).forEach(key => {
            const connection = config.connections[key];
            if (!connection.orm.seeds)
                delete config.connections[key];

            const ormConfig = Object.assign({}, connection.orm, {
                migrations: connection.orm.seeds,
                migrationsDir: connection.orm.seedsDir,
                migrationsTableName: '_seeds' 
             });
             connection.orm = ormConfig;
        });
    });
}

async function handle(callback, ignoreFailure) {
    let exitCode = 0;
    const oldExit = process.exit;
    process.exit = (code) => exitCode = code || 0;

    try {
        await callback();
    } finally {
        process.exit = oldExit;
        if (exitCode > 0 && !ignoreFailure)
            process.exit(exitCode);
    }
}

program
    .command('migration:create <name>')
    .description('Creates a database migration')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (name, options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        if (config.connections.global)
          await handle(() => createMigration(name, config, "global"));

        const firstPrivConnName = Object.keys(config.connections).find(key => minimatch(key, 'private-*'));
        if (config.connections[firstPrivConnName])
            await handle(() => createMigration(name, config, firstPrivConnName));
    });

program
    .command('migration:generate <name>')
    .description('Generates database migrations')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (name, options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        if (config.connections.global)
          await handle(() => generateMigrations(name, config, "global"));

        const firstPrivConnName = Object.keys(config.connections).find(key => minimatch(key, 'private-*'));
        if (config.connections[firstPrivConnName])
            await handle(() => generateMigrations(name, config, firstPrivConnName));
    });

program
    .command('migration:run')
    .description('Runs database migrations')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => runMigrations(config, name));
    });

program
    .command('migration:revert')
    .description('Reverts database migrations')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => revertMigrations(config, name));
    });

program
    .command('migration:show')
    .description('Reverts database migrations')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => showMigrations(config, name), true);
    });

program
    .command('schema:log')
    .description('Logs database schema changes')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => schemaLog(config, name));
    });

program
    .command('schema:sync')
    .description('Syncs database schema changes')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => schemaSync(config, name));
    });

program
    .command('schema:drop')
    .description('Drops database schema')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {
        await select.prompt(options);

        const config = await loadConfig(options.brand, options.stage, options.scope);

        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => schemaDrop(config, name));
    });

program
    .command('seed:create <name>')
    .description('Creates a database seed')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (name, options) => {
        await select.prompt(options);

        const config = await loadSeedConfig(options.brand, options.stage, options.scope);

        if (config.connections.global)
          await handle(() => createSeed(name, config, "global"));

        const firstPrivConnName = Object.keys(config.connections).find(key => minimatch(key, 'private-*'));
        if (config.connections[firstPrivConnName])
            await handle(() => createSeed(name, config, firstPrivConnName));
    });

program
    .command('seed:run')
    .description('Seeds a database')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {   
        await select.prompt(options);
        
        const config = await loadSeedConfig(options.brand, options.stage, options.scope);
        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => runSeed(config, name));
    });

program
    .command('seed:revert')
    .description('Reverts seeding of a database')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {      
        await select.prompt(options);
        
        const config = await loadSeedConfig(options.brand, options.stage, options.scope);
        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => revertSeed(config, name));
    });

program
    .command('seed:show')
    .description('Shows seeds')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .action(async (options) => {     
        await select.prompt(options);
        
        const config = await loadSeedConfig(options.brand, options.stage, options.scope);
        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => showSeeds(config, name), true);
    });

program
    .command('user:sync')
    .description('Synchronises user passwords and creates them if necessary')
    .option('-s, --brand <brand>', 'The database brand')
    .option('-s, --stage <stage>', 'The database stage')
    .option('-c, --scope <scope>', 'Include only database connections that match this scope')
    .option('-r, --regenerate', 'Force regeneration of passwords')
    .action(async (options) => {     
        await select.prompt(options);
        
        const config = await loadConfig(options.brand, options.stage, options.scope);
        const connectionNames = Object.keys(config.connections);

        for(const name of connectionNames)
            await handle(() => syncUsers(config, name, options.regenerate));
    });

program.parse(process.argv);
