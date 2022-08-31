'use strict'

/**
 * @module serverless-plugin-select
 *
 * @see {@link https://serverless.com/framework/docs/providers/aws/guide/plugins/}
 *
 * @requires 'bluebird'
 * */
const BbPromise = require('bluebird')

class Enabled {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.hooks = {
            'package:initialize': this.initializeHook.bind(this)
        };
    }

    /**
     * @description Initialize hook
     *
     * @fulfil {} — Functions optimized
     * @reject {Error} Enabled error
     *
     * @return {(boolean|Promise)}
     * */
    initializeHook() {
        /** Skip function selection */
        if (this.options.noDeploy) {
            return false;
        }

        if (this.serverless.service.serviceObject.enabled === false)
            this.skipAll();

        /** Select single function */
        if (this.options.function) {
            return this.selectFunction(this.options.function);
        } else {
            /** Select all functions */
            return this.selectAllFunctions();
        }
    }

    /**
     * @description Select all functions
     *
     * @fulfil {} — All selected functions
     * @reject {Error} Selection error
     *
     * @return {Promise}
     * */
    selectAllFunctions() {
        /** Get functions */
        let allFunctions = this.serverless.service.getAllFunctions();

        const functionCount = allFunctions.length;

        /** Select functions for deployment */
        return BbPromise.map(allFunctions, (functionName) => this.selectFunction(functionName))
            .then(() => {
                allFunctions = this.serverless.service.getAllFunctions();
                const removedFunctionCount = functionCount - allFunctions.length;

                if (removedFunctionCount === functionCount)
                    this.skipAll('All functions skipped.');

                if (removedFunctionCount > 0)
                    this.serverless.cli.log(`Removed ${removedFunctionCount} disabled function${removedFunctionCount !== 1 ? 's' : ''}, ${functionCount} remaining.`);
            });
    }

    /**
     * @description Select function
     *
     * @param {string} functionName - Function name
     *
     * @fulfil {} — Selected function
     * @reject {Error} Selection error
     *
     * @return {Promise}
     * */
    selectFunction(functionName) {
        /** Select promise */
        return new BbPromise((resolve, reject) => {
            /** Function object variables */
            const functionObject = this.serverless.service.getFunction(functionName);

            /** Select function properties */
            const disabled = functionObject.enabled === false;

            /** Deployment region not selected for function deployment */
            if (disabled) {
                delete this.serverless.service.functions[functionName];

                /** Reject promise if deploying one function */
                if (this.options.function)
                    return reject('Select: ' + functionName + ' has been disabled.');
            }

            /** Resolve with function object */
            resolve(functionObject);
        });
    }

    skipAll(message) {
        /** Skip all */
        this.serverless.cli.log(message || 'Service is disabled, skipping.');
        process.exit(0);
    }
}

module.exports = Enabled;