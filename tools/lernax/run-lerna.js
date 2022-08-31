const execa = require('execa');

async function runLerna(command, packages, parallel, bail, args) {
    if (packages.length === 0) {
        console.error('No packages found to run command on.');
        return;
    }

    const commandArgs = [
        'run',
        command
    ];

    if (parallel)
        commandArgs.push('--parallel');

    if (!bail)
        commandArgs.push('--no-bail');

    const scopes = packages.map(p => [`--scope`, `${p.name}`]);

    for (const scope of scopes)
        commandArgs.push(...scope);

    if (args && args.length > 0)
        commandArgs.push('--', ...args);

    await execa.node(__dirname + '/lerna-cli.js', commandArgs, {
        stdio: 'inherit'
    });
}

module.exports = runLerna;