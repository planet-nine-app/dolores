import fs from 'fs';
import db from '../../persistence/db.js';

// Adding a test feed
const TEST_FEED = 'https://sockpuppet.band/canimus.json';

const canimus = {
  feeds: [],
  feedURLs: [TEST_FEED],

  refreshFeeds: async () => {
    if(!fs.existsSync('./feeds')) {
      fs.mkdirSync('./feeds');
    }

    const promises = canimus.feedURLs.map(async $ => {
      const resp = await fetch($);
      return resp.json();
    });
    canimus.feeds = await Promise.all(promises);

    //TODO: write feeds to fs
  } 
};

export default canimus;
