import fs from 'fs';
import { BskyAgent } from '@atproto/api';
import db from '../../persistence/db.js';

const nullify = (post) => {
  const images = post.embed && post.embed.images;
  const url = post.embed && post.embed.playlist;

  return {
    uuid: post.cid,
    description: post.record && post.record.text,
    images,
    url
  };
};

const bsky = {
  videoPosts: [],
  picPosts: [],
  genericPosts: [],
  allPosts: [],
  lastRefresh: new Date().getTime(),

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
      const videoPromises = videoFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 30}));
      const picPromises = picFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 30}));
      const genericPromises = genericFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 30}));

      const videoResponses = await Promise.all(videoPromises);
      const picResponses = await Promise.all(picPromises);
      const genericResponses = await Promise.all(genericPromises);

      videoResponses.forEach(async response => {
	for(var i = 0; i < response.data.feed.length; i++) {
	  const post = response.data.feed[i];
          if(!post.post || !post.post.embed || !post.post.embed.playlist) {
            continue;
          }

          const remapped = nullify(post.post);

          bsky.videoPosts.push(remapped);
          bsky.allPosts.push(remapped);
	}
      });

      picResponses.forEach(response => response.data.feed.forEach(post => {
        const remapped = nullify(post.post);
        bsky.picPosts.push(remapped);
        bsky.allPosts.push(remapped);
      }));

      genericResponses.forEach(response => response.data.feed.forEach(post => {
        const remapped = nullify(post.post);
        bsky.genericPosts.push(remapped);
        bsky.allPosts.push(remapped);
      }));

      bsky.lastRefresh = new Date().getTime();
console.log('after nullifying', bsky);

    } catch(err) {
    console.warn('no feed on feed');
    console.warn(err);
    }
  }
};

console.log(bsky);

export default bsky;
