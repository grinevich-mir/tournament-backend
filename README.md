# Tournament Backend

## Prerequisites

For development it's best to install `yarn` and `lerna` globally
```console
$ npm install -g yarn lerna
```

## Installing
```console
$ lerna bootstrap
```
Or
```console
$ yarn
```

## Build
```console
$ yarn build
```
To build a specific package you can do the following:
```console
$ yarn build --scope @tcom/system
```

## Deploy

Without specifying any parameters deploy scripts will prompt you for `brand` and `stage` arguments, the default region is `us-east-1`:
```console
$ yarn deploy
```
To specify specific parameters you can append arguments like so:
```console
$ yarn deploy --brand <brand> --stage <dev|uat|prod> --region <region>
```

## Adding Dependencies
### NPM packages
In the package folder you want to add it to:
```console
$ yarn add <package-name>
```
### Local packages

To add a dependency on a package within the monorepo you can run the following to install it to **all** other packages in the monorepo:
```
$ lerna add @tcom/platform
```
Or if you want to install to a specific package:
```console
$ lerna add @tcom/platform --scope @tcom/service-client-user
```
Or if you want to install to a filtered set of packages:
```console
$ lerna add @tcom/platform --scope @tcom/service-client-*
```
You can also use the above method to install NPM packages.