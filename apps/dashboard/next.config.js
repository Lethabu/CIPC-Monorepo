/**
 * next.config.js (dashboard - Host app)
 * Module Federation for Host (consumes remote exposed components from cipc-mfe)
 */
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cipc/ui'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new NextFederationPlugin({
          name: 'dashboard',
          filename: 'static/chunks/remoteEntry.js',
          remotes: {
            cipc_mfe: process.env.NODE_ENV === 'production'
              ? `cipc_mfe@https://cipc-mfe.vercel.app/_next/static/chunks/remoteEntry.js`
              : `cipc_mfe@http://localhost:3001/_next/static/chunks/remoteEntry.js`,
          },
          shared: {
            react: { singleton: true, requiredVersion: false },
            'react-dom': { singleton: true, requiredVersion: false },
          },
        })
      );
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'cipc_mfe/CipcHealth': false,
        'cipc_mfe/FilingHistory': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;