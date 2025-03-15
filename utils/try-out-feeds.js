import { BskyAgent } from '@atproto/api';
import * as fs from 'fs';
const feeds = JSON.parse(fs.readFileSync('./feeds.json'));

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

for(var feed in feeds) {
console.log('getting ', feeds[feed]);
  agent.app.bsky.feed.getFeed({feed: feeds[feed], limit: 2}).then(posts => console.log(feed, 'looks like', posts)).catch(console.warn);
}
