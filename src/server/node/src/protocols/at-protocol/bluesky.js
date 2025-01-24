import fs from 'fs';
import { BskyAgent } from '@atproto/api';
import db from '../../persistence/db.js';

let agent;

try {
  agent = new BskyAgent({
    service: 'https://bsky.social'
  });
  const session = await agent.login({
    identifier: 'server@allyabase.com',
    password: 'zkln-k2ln-4p2i-hkhl'
  });
} catch(err) {
console.warn(err);
}

const VIDEO_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';

try {
  const response = await agent.app.bsky.feed.getFeed({
    feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids',
    limit: 100
  });

  for(var i = 0; i < response.data.feed.length; i++) {
    const post = response.data.feed[i].post;
    const videoUUID = post.cid;
    const timestamp = new Date(post.indexedAt).getTime() + '';
    fs.writeFileSync('./video/' + videoUUID, post.embed.playlist);
    await db.putVideoMeta(videoUUID, {timestamp, tags: ['latest']});
  }
} catch(err) {
console.warn('no feed on feed');
console.warn(err);
}

// TODO: figure out how and when to fetch
const bsky = {};

export default bsky;
