const webpack = require('../../webpack.config.base');

// Override base configuration by adding properties to this.
const config = {
};

module.exports = webpack(__dirname, config, true);