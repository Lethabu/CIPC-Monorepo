/**
 * next.config.js (cipc-mfe - Remote app)
 * Module Federation: exposes components to be loaded by the Host app.
 */
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Expose components only in client build
    if (!isServer) {
      config.plugins.push(
        new NextFederationPlugin({
          name: 'cipc_mfe',
          filename: 'static/chunks/remoteEntry.js',
          exposes: {
            './CipcHealth': './pages/CipcHealth',
            './FilingHistory': './src/components/FilingHistory',
          },
          shared: {
            react: { singleton: true, requiredVersion: false },
            'react-dom': { singleton: true, requiredVersion: false },
              '@cipc/ui': { singleton: true, requiredVersion: false },
            },
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;
