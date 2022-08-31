# Tournament Backend / Platform

## Database
We are using [TypeORM](https://github.com/typeorm/typeorm) for database management. Due to the nature of our infrastructure it is necessary to take certain steps to be able to do anything with the databases.

### DB Helper Tool
To facilitate database operations we have created a tool to create, generate and run migrations and seeds. Typically this tool is used by running the following:
```console
$ yarn db <COMMAND> --stage [stage] --scope [scope]
```

| Parameter  | Default | Description                                                                              |
| -----------|---------|------------------------------------------------------------------------------------------|
| brand      |         | The brand for which run the command against                                              |
| stage      |         | The environment to run against as configured in `db-config.ts`                           |
| scope      | *       | The scope for connections to have the command run against using a glob. e.g. `private-*` |

If you do not supply the `brand` and `stage` parameters, you will be prompted to select them.

For a list of commands:
```console
$ yarn db --help
```

For command help:
```console
$ yarn db <COMMAND> --help
```

### Configuration
In order to do anything with the databases you need to have the appropriate access. The following are required:
- **A private key without passphrase**
- **A valid SSH key on the bastion box** - this allows you to jump to the MySQL clusters.

You must have the appropriate access tokens in your `~/.aws/credentials` file to allow to tool to retrieve and decrypt the database passwords.

#### Private SSH Key Problems
In the event that you are getting an error when trying to perform database tasks such as:

```
Error: Cannot parse privateKey: Unsupported key format
```
This is likely because you are using a newer version of OpenSSH private key that the SSH tunnel library `ssh2` doesn't support but also because you are not using nodejs 12.

It is not necessary to upgrade your nodejs version but it is necessary to convert your private SSH key to PEM format doing the following:
```console
$ ssh-keygen -p -f ~/.ssh/<PRIVATE KEY FILE> -m pem
```

### Migrations
Database schema changes should be done using **migrations**. These are scripts that run against the database to synchronise any changes with the code and database schema.
#### Creating an Empty Migration
To create an empty migration you can run the following:
```console
$ yarn db migration:create <MigrationName> --brand [brand] --stage [stage] --scope [scope]
```
#### Generating a Migration
To generate a migration based on the code compared to the database schema run the following:
```console
$ yarn db migration:generate <MigrationName> --brand [brand] --stage [stage] --scope [scope]
```
#### Running Migrations
To run migrations you can run the following:
```console
$ yarn db migration:run --brand [brand] --scope [scope]
```
#### Reverting Migrations
To revert the last migration you can run the following:
```console
$ yarn db migration:revert --brand [brand] --scope [scope]
```
#### Showing Migrations
To show migrations and whether they have been applied, run the following:
```console
$ yarn db migration:show --brand [brand] --stage [stage] --scope [scope]
```
**[ X ]** means that the migration has been applied to the target environment database.

### Seeds
You can seed the database in a similar way to migrations (in fact, underneath it uses the migrations functionality but with different configurations). The only difference is you can't `generate` seeds.
#### Creating an Empty Seed
To create an empty seed you can run the following:
```console
$ yarn db seed:create <SeedName> --brand [brand] --stage [stage] --scope [scope]
```
#### Running Seeds
To run seeds you can run the following:
```console
$ yarn db seed:run --brand [brand] --stage [stage] --scope [scope]
```
#### Reverting Seeds
To revert the last seed you can run the following:
```console
$ yarn db seed:revert --brand [brand] --stage [stage] --scope [scope]
```
#### Showing Seeds
To show seeds and whether they have been applied, run the following:
```console
$ yarn db seed:show --brand [brand] --stage [stage] --scope [scope]
```
**[ X ]** means that the seed has been applied to the target environment database.

#### User Sync
This keeps SSM parameters and database users in sync. 

```console
$ yarn db user:sync --brand [brand] --stage [stage] --scope [scope]
```
This will do the following:

- If there are no password SSM parameters on any of the regions it will generate a password and add the parameters.
- If a region is missing the SSM parameter for a user password, it will be created based on the first region with a SSM parameter value.
- If SSM parameter values are mismatched between regions, it will update them with the parameter value of the first region with a password.
- If the user(s) do not exist in the database, they will be created.
- Under all circumstances, the database user password and permissions will be updated to match the SSM parameters to ensure they are in sync.

If you want to regenerate the passwords you can add the `--regenerate` flag and new passwords will be generated for each user and synchronised across regions.

### **IMPORTANT**
Do not modify the `ormconfig.ts` file unless you know what you're doing. This file is used by the DB helper tool to generate the appropriate connection configs for `TypeORM` to use at runtime.