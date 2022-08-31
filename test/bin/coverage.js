const NYC = require('nyc');
const configUtil = require('nyc/lib/config-util');
const resolveFrom = require('resolve-from');

class Coverage {
    initialised = false;

    async init() {
        const baseConfig = await configUtil(process.cwd());

        this.config = {
            ...baseConfig.argv,
            cache: true,
            extension: ['.ts', '.tsx'],
            reporter: ['text', 'lcov'],
            include: [
                "src/**"
            ],
            exclude: [
                "src/handler.ts",
                "src/models/index.ts"
            ]
        };

        const nyc = new NYC(this.config);
        this.nyc = nyc;

        await nyc.reset();

        const env = {
            NYC_CONFIG: JSON.stringify(this.config),
            NYC_CWD: process.cwd()
        };

        const requireModules = [
            require.resolve('nyc/lib/register-env'),
            ...nyc.require.map(mod => resolveFrom.silent(nyc.cwd, mod) || mod)
        ];

        const preloadList = require('node-preload');
        preloadList.push(
            ...requireModules,
            require.resolve('nyc/lib/wrap')
        )

        Object.assign(process.env, env)

        await nyc.createTempDirectory();
        await nyc.addAllFiles();
        nyc.wrap();

        this.initialised = true;
    }

    async report() {
        if (!this.initialised || !this.nyc)
            return;

        console.log('- CODE COVERAGE -');
        await this.nyc.report();
    }

    async check() {
        process.stdout.write('\u001b[31m\x1b[1m');
        await this.nyc.checkCoverage({
            branches: this.config.branches,
            statements: this.config.statements,
            lines: this.config.lines,
            functions: this.config.functions
        }, true);
        process.stdout.write('\u001b[0m');
    }
}

module.exports = Coverage;