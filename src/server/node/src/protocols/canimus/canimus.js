import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../../persistence/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Feed URLs
const SOCKPUPPET_FEED = 'https://sockpuppet.band/canimus.json';
const BURY_THE_NEEDLE_FEED = path.join(__dirname, '../../../../../../public/bury-the-needle-feed.json');

const canimus = {
  feeds: [],
  feedURLs: [
    { url: SOCKPUPPET_FEED, type: 'remote' },
    { url: BURY_THE_NEEDLE_FEED, type: 'local' }
  ],

  refreshFeeds: async () => {
    if(!fs.existsSync('./feeds')) {
      fs.mkdirSync('./feeds');
    }

    const promises = canimus.feedURLs.map(async feedConfig => {
      if (feedConfig.type === 'local') {
        // Read local file
        const data = fs.readFileSync(feedConfig.url, 'utf8');
        return JSON.parse(data);
      } else {
        // Fetch remote feed
        const resp = await fetch(feedConfig.url);
        const feed = await resp.json();

        // Add name if missing
        if (!feed.name && feed.children?.[0]?.name) {
          feed.name = `${feed.children[0].name} - Music Feed`;
        }

        return feed;
      }
    });
    canimus.feeds = await Promise.all(promises);

    //TODO: write feeds to fs
  }
};

export default canimus;
