import fs from 'fs';
import { BskyAgent } from '@atproto/api';
import db from '../../persistence/db.js';

const PROTOCOL = 'at-protocol';
const MAX_POSTS = 500;

const nullify = (post) => {
  const images = post.embed && post.embed.images;
  const url = post.embed && post.embed.playlist;

  return {
    uuid: post.uri,
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

    const atProtocolFeeds = await db.getFeeds(PROTOCOL);

    const videoFeeds = atProtocolFeeds.videoFeeds || [];
    if(videoFeeds === 0) {
      const VIDEO_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';
      videoFeeds.push(VIDEO_FEED_URI);
    }

    const picFeeds = atProtocolFeeds.picFeeds || [];
    if(picFeeds === 0) {
      const CAT_PICS_URI = 'at://did:plc:ss74gre7gpgnvgvzf5zfcsks/app.bsky.feed.generator/aaaas563rbb5q';
      picFeeds.push(CAT_PICS_URI);
    }

    const genericFeeds = atProtocolFeeds.genericFeeds || [];
    if(genericFeeds.length === 0) {
      const SCIENCE_URI = 'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science';
      const BOOKS_URI = 'at://did:plc:geoqe3qls5mwezckxxsewys2/app.bsky.feed.generator/aaabrbjcg4hmk';
      genericFeeds.push(SCIENCE_URI);
      genericFeeds.push(BOOKS_URI);
    }

    try {
      const videoPromises = videoFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 30}));
      const picPromises = picFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 30}));
      const genericPromises = genericFeeds.map($ => agent.app.bsky.feed.getFeed({feed: $, limit: 30}));

      const videoResponses = await Promise.all(videoPromises);
      const picResponses = await Promise.all(picPromises);
      const genericResponses = await Promise.all(genericPromises);

      const noop = () => {};

      videoResponses.forEach(async response => {
	for(var i = 0; i < response.data.feed.length; i++) {
	  const post = response.data.feed[i];
          if(!post.post || !post.post.embed || !post.post.embed.playlist) {
            continue;
          }

          const remapped = nullify(post.post);

          bsky.videoPosts.push(remapped);
          bsky.allPosts.push(remapped);
   

          bsky.videoPosts.length > MAX_POSTS ? bsky.videoPosts.shift() : noop();
          bsky.allPosts.length > MAX_POSTS ? bsky.allPosts.shift() : noop();
	}
      });

      picResponses.forEach(response => response.data.feed.forEach(post => {
        const remapped = nullify(post.post);
        bsky.picPosts.push(remapped);
        bsky.allPosts.push(remapped);

        bsky.picPosts.length > MAX_POSTS ? bsky.picPosts.shift() : noop();
        bsky.allPosts.length > MAX_POSTS ? bsky.allPosts.shift() : noop();
      }));

      genericResponses.forEach(response => response.data.feed.forEach(post => {
        const remapped = nullify(post.post);
        bsky.genericPosts.push(remapped);
        bsky.allPosts.push(remapped);

        bsky.genericPosts.length > MAX_POSTS ? bsky.genericPosts.shift() : noop();
        bsky.allPosts.length > MAX_POSTS ? bsky.allPosts.shift() : noop();
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
