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

const vidURI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';

/*const timeline = await agent.getTimeline({limit: 100});
console.log(timeline);
const videos = timeline.data.feed.filter($ => $.embed && $.embed['$type'] === 'app.bsky.embed.video');
videos.map(console.log);*/

/*const feed = await agent.getFeedGenerator({feed: vidURI, limit: 100});
const videos = feed.data.feed;
console.log(videos);*/

/*const posts = await agent.getPosts({uris: [vidURI]});
console.log(posts);*/

try {
const response = await agent.app.bsky.feed.getFeed({
  feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids',
  limit: 100
});
//console.log(response);
//console.log(response.data.feed);
//console.log(response.data.feed[0].post.embed);
console.log('response posts count', response.data.feed.length);
for(var i = 0; i < response.data.feed.length; i++) {
  const post = response.data.feed[i].post;
  const videoUUID = post.cid;
  const timestamp = new Date(post.indexedAt).getTime() + '';
  fs.writeFileSync('./video/' + videoUUID, post.embed.playlist);
console.log('about to write ' + videoUUID + ' to the db');
  await db.putVideoMeta(videoUUID, {timestamp, tags: ['latest']});
console.log('should have written videoUUID');
}
/*response.data.feed.forEach(async $ => {
  const post = $.post;
  const videoUUID = post.cid;
  const timestamp = new Date(post.indexedAt).getTime() + '';
  fs.writeFileSync('./video/' + videoUUID, post.embed.playlist);
console.log('about to write ' + videoUUID + ' to the db');
  await db.putVideoMeta(videoUUID, {timestamp, tags: ['latest']});
});*/

} catch(err) {
console.warn('no feed on feed');
console.warn(err);
}

/*try {
const response = await agent.app.bsky.feed.getTimeline({
  feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids',
  limit: 100
});
} catch(err) {
console.warn('no timeline on feed');
console.warn(err);
}*/


const bsky = {};

export default bsky;
