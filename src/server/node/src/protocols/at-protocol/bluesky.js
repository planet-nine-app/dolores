import fs from 'fs';
import { BskyAgent } from '@atproto/api';
import db from '../../persistence/db.js';

const bsky = {
  videoPosts: [],
  picPosts: [],
  genericPosts: [],
  allPosts: [],

  refreshPosts: async () => {
    if(!fs.existsSync('./video')) {
      fs.mkdirSync('./video');
    }

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

    const videoFeeds = [];
    const VIDEO_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';
    videoFeeds.push(VIDEO_FEED_URI);

    const picFeeds = [];
    const CAT_PICS_URI = 'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/cv:cat';
    picFeeds.push(CAT_PICS_URI);

    const genericFeeds = [];
    const SCIENCE_URI = 'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science';
    const BOOKS_URI = 'at://did:plc:geoqe3qls5mwezckxxsewys2/app.bsky.feed.generator/aaabrbjcg4hmk';
    genericFeeds.push(SCIENCE_URI);
    genericFeeds.push(BOOKS_URI);

    try {
      const videoPromises = videoFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 2}));
      const picPromises = picFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 2}));
      const genericPromises = genericFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 2}));

      const videoResponses = await Promise.all(videoPromises);
      const picResponses = await Promise.all(picPromises);
      const genericResponses = await Promise.all(genericPromises);

console.log('videoResponses', videoResponses.flatMap($ => $.data.feed));
console.log('picResponses', picResponses.flatMap($ => $.data.feed));
console.log('genericResponses', genericResponses.flatMap($ => $.data.feed).map($ => console.log(JSON.stringify($.post))));

      videoResponses.forEach(async response => {
	for(var i = 0; i < response.data.feed.length; i++) {
	  const post = response.data.feed[i];
          if(!post.post || !post.post.embed || !post.post.embed.playlist) {
            continue;
          }
	  const videoUUID = post.post.cid;
	  const timestamp = new Date(post.post.indexedAt).getTime() + '';

	  fs.writeFileSync('./video/' + videoUUID, post.post.embed.playlist);
	  await db.putVideoMeta(videoUUID, {timestamp, tags: ['latest']});
          post.post.uuid = post.post.cid;

          bsky.videoPosts.push(post);
          bsky.allPosts.push(post);
	}
      });

      picResponses.forEach(response => response.data.feed.forEach(post => {
        bsky.picPosts.push(post);
        bsky.allPosts.push(post);
      }));
      genericResponses.forEach(response => response.data.feed.forEach(post => {
        bsky.genericPosts.push(post);
        bsky.allPosts.push(post);
      }));

    } catch(err) {
    console.warn('no feed on feed');
    console.warn(err);
    }
  }
};

console.log(bsky);

export default bsky;
