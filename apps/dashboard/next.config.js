/**
 * next.config.js (dashboard - Host app)
 * Module Federation for Host (consumes remote exposed components from cipc-mfe)
 */
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/**
 * NOTE: remoteEntry URL uses the remote app dev port (3001). When deploying,
 * update the remotes URL to point to the deployed `cipc-mfe` remoteEntry location.
 */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new NextFederationPlugin({
          name: 'dashboard',
          filename: 'static/chunks/remoteEntry.js',
          remotes: {
            // Load from localhost in dev, deployed URL in prod
            cipc_mfe: process.env.NODE_ENV === 'production'
              ? `cipc_mfe@https://cipc-mfe.vercel.app/_next/static/chunks/remoteEntry.js`
              : `cipc_mfe@http://localhost:3001/_next/static/chunks/remoteEntry.js`,
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
