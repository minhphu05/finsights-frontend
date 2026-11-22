import type { NextConfig } from 'next';
const config: NextConfig = { trailingSlash: true, images: { unoptimized: true } };
config.experimental = { ...config.experimental, agentUpgrade: 'security' };
export default config;
