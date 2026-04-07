import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // Redirects for simplified navigation
  async redirects() {
    return [
      // Blog → Lens redirects (permanent for SEO)
      {
        source: '/blog',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/lens/:slug',
        permanent: true,
      },
      {
        source: '/pricing',
        destination: '/',
        permanent: false,
      },
      {
        source: '/compare',
        destination: '/lens',
        permanent: false,
      },
      {
        source: '/explore',
        destination: '/',
        permanent: false,
      },
      {
        source: '/deep-dive/:id',
        destination: '/lens',
        permanent: false,
      },
      {
        source: '/experiment',
        destination: '/',
        permanent: false,
      },
      {
        source: '/framing-watch',
        destination: '/lens',
        permanent: false,
      },
      {
        source: '/scan/:date',
        destination: '/archive',
        permanent: false,
      },
      {
        source: '/history',
        destination: '/archive',
        permanent: false,
      },
      {
        source: '/ask',
        destination: '/',
        permanent: false,
      },
      {
        source: '/onboarding',
        destination: '/',
        permanent: false,
      },
      {
        source: '/perception-gap/data',
        destination: '/indexes/pgi/data',
        permanent: true,
      },
      {
        source: '/perception-gap',
        destination: '/indexes/pgi',
        permanent: true,
      },
      {
        source: '/pgi',
        destination: '/indexes/pgi',
        permanent: true,
      },
      {
        source: '/gai',
        destination: '/indexes/gai',
        permanent: true,
      },
      // Intelligence → Lens pillar redirects
      {
        source: '/intelligence',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/intelligence/information-warfare',
        destination: '/lens?pillar=the-signal',
        permanent: true,
      },
      {
        source: '/intelligence/energy',
        destination: '/lens?pillar=the-flow',
        permanent: true,
      },
      // Page purge redirects (2026-03-23)
      {
        source: '/divided',
        destination: '/indexes/pgi',
        permanent: true,
      },
      {
        source: '/unseen',
        destination: '/indexes/gai',
        permanent: true,
      },
      {
        source: '/pillars',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/pillars/:pillar',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/perception-gap-index',
        destination: '/indexes/pgi',
        permanent: true,
      },
      {
        source: '/perception-gap/about',
        destination: '/methodology',
        permanent: true,
      },
      {
        source: '/pgi/:date',
        destination: '/indexes/pgi',
        permanent: true,
      },
      {
        source: '/what-is-perception-gap-index',
        destination: '/methodology',
        permanent: true,
      },
      {
        source: '/what-is-global-attention-index',
        destination: '/methodology',
        permanent: true,
      },
      {
        source: '/indexes/information',
        destination: '/indexes',
        permanent: true,
      },
      {
        source: '/live',
        destination: '/',
        permanent: false,
      },
      {
        source: '/research',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/framing-lab',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/briefing',
        destination: '/archive',
        permanent: true,
      },
      {
        source: '/digest',
        destination: '/archive',
        permanent: true,
      },
      {
        source: '/tags/:tag',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/blind-spots',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/stories/:slug',
        destination: '/lens/:slug',
        permanent: true,
      },
      {
        source: '/topics/:topic',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/under-the-radar',
        destination: '/lens',
        permanent: true,
      },
      {
        source: '/glossary',
        destination: '/about',
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
