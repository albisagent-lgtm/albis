#!/usr/bin/env node

import { program } from 'commander';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// Load environment
const envPath = path.join(process.cwd(), '.env.postiz');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY;
const POSTIZ_BASE_URL = 'https://api.postiz.com/public/v1';

if (!POSTIZ_API_KEY) {
  console.error('POSTIZ_API_KEY not found in environment');
  process.exit(1);
}

program
  .name('postiz-cli')
  .description('CLI for posting to X via Postiz')
  .version('1.0.0');

program
  .option('-p, --post <text>', 'Text content to post')
  .option('-i, --integration <id>', 'Integration ID for X account')
  .option('-m, --media <urls>', 'Comma-separated media URLs')
  .action(async (options) => {
    try {
      if (!options.post || !options.integration) {
        console.error('Both --post and --integration are required');
        process.exit(1);
      }

      const postData = {
        content: options.post,
        settings: {
          __type: 'x'
        },
        integrations: [options.integration],
        shortLink: false,
        tags: []
      };

      if (options.media) {
        postData.media = options.media.split(',').map(url => url.trim());
      }

      const response = await fetch(`${POSTIZ_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': POSTIZ_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to post: ${response.status} ${error}`);
        process.exit(1);
      }

      const result = await response.json();
      console.log('Posted successfully:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error posting:', error);
      process.exit(1);
    }
  });

program.parse();