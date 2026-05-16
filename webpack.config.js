const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
    ...defaultConfig,
    entry: {
        index: './src/index.js',
        admin: './admin/src/index.js',
    },
};