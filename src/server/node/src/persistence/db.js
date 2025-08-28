import { createClient } from './client.js';
import sessionless from 'sessionless-node';

const MAX_POSTS = 99; // This will be configurable eventually
const POSTS_DIR = 'local-posts';
const PROTOCOLS = ['at-protocol', 'instagram', POSTS_DIR];
  
const client = await createClient()
  .on('error', err => console.log('Client Error', err))
  .connect();
    
const db = {
  getUserByUUID: async (uuid) => {
    const user = await client.get(`user:${uuid}`);
    if(!user) {
console.log('throwing');
      throw new Error('not found');
    }
    let parsedUser = JSON.parse(user);

    const feeds = {};
 
    for(var i = 0; i < PROTOCOLS.length; i++) {
      const protocol = PROTOCOLS[i];
      const feed = await db.getFeeds(protocol);
      feeds[protocol] = feed;
    }

    parsedUser.feeds = feeds;

    return parsedUser; 
  },

  getUserByPublicKey: async (pubKey) => {
    const uuid = await client.get(`pubKey:${pubKey}`);
    const user = await client.get(`user:${uuid}`);
    if(!user) {
      throw new Error('not found');
    }
    let parsedUser = JSON.parse(user);

    const feeds = {};
 
    for(var i = 0; i < PROTOCOLS.length; i++) {
      const protocol = PROTOCOLS[i];
      const feed = await db.getFeeds(protocol);
      feeds[protocol] = feed;
    }

    parsedUser.feeds = feeds;

    return parsedUser; 
  },

  putUser: async (user) => {
    const uuid = sessionless.generateUUID();
    user.uuid = uuid;
    await client.set(`user:${uuid}`, JSON.stringify(user));
    await client.set(`pubKey:${user.pubKey}`, uuid);
    return user;
  },

  saveUser: async (user) => {
    await client.set(`user:${user.uuid}`, JSON.stringify(user));
    return true;
  },

  deleteUser: async (user) => {
    await client.del(`pubKey:${user.pubKey}`);
    const resp = await client.del(`user:${user.uuid}`);

    return true;
  },

  saveKeys: async (keys) => {
    await client.set(`keys`, JSON.stringify(keys));
  },

  getKeys: async () => {
    const keyString = await client.get('keys');
    return JSON.parse(keyString);
  },

  getPosts: async () => {
    const postString = await client.get(POSTS_DIR) || '{"posts": []}';
    const posts = JSON.parse(postString);

    return posts;
  },

  savePost: async (post) => {
    const postString = await client.get(POSTS_DIR) || '{"posts": []}';
    let posts = JSON.parse(postString);

    posts.posts.push(post);  
    if(posts.length > MAX_POSTS) {
      posts = posts.slice(1, MAX_POSTS);
    }

    await client.set(POSTS_DIR, JSON.stringify('posts'));

    return posts;
  },

  saveFeeds: async (protocol, feeds) => {
    const feedString = JSON.stringify(feeds);
    await client.set(protocol, feedString);

    return true;
  },

  getFeeds: async (protocol) => {
    const feedString = await client.get(protocol) || '{}';
    const feeds = JSON.parse(feedString);

    return feeds;
  },

  putVideo: async (user, video) => {
console.log('putting video', video);
    const uuid = user.uuid;
    video.uuid = uuid;
    await client.set(`${user.uuid}:video:${video.timestamp}`, JSON.stringify(video));
    
    const timestampsJSON = (await client.get(`videos:${uuid}`)) || '{}';
    const timestamps = JSON.parse(timestampsJSON);
    timestamps[video.timestamp] = video;
    await client.set(`videos:${uuid}`, JSON.stringify(timestamps));
    return video;
  },

  getVideo: async (uuid, timestamp) => {
    const video = await client.get(`${uuid}:video:${timestamp}`);
    if(!video) {
      throw new Error('not found');
    }
    return JSON.parse(video);
  },

  putVideoMeta: async (uuid, meta) => {
    await client.set(`meta:${uuid}`, JSON.stringify(meta));

    const tagsString = await client.get(`videoMetaTags`) || '{}';
    const tags = JSON.parse(tagsString);    

    meta.tags.forEach(tag => {
      if(!tags[tag]) {
        tags[tag] = [{timestamp: meta.timestamp, uuid}];
      } else {
        tags[tag].push({timestamp: meta.timestamp, uuid});
      }
    });

    await client.set(`videoMetaTags`, JSON.stringify(tags));

    return true;
  },

  getVideoMeta: async (uuid) => {
    const metaString = await client.get(`meta:${uuid}`);
    const meta = JSON.parse(metaString);

    return meta;
  },

  getVideosForTags: async (tagsToGet) => {
    const tagsString = await client.get('videoMetaTags') || '{}';
    const tags = JSON.parse(tagsString);

    const videosToReturn = tagsToGet.flatMap(tag => tags[tag]).filter($ => $);

    return videosToReturn || [];
  },

  getLatestVideos: async (total) => {
console.log('getting latest videos');
    const tagsString = await client.get('videoMetaTags') || '{}';
    const tags = JSON.parse(tagsString);
    const tagsArray = Object.keys(tags);

    let metaArray = [];
    tagsArray.forEach(tag => {
      metaArray = [...metaArray, ...tags[tag]];
    });

console.log('metaArray', metaArray);
metaArray.map(console.log);

    const uniqueVideos = new Set(metaArray.map(item => JSON.stringify(item)));

    const videosToReturn = Array.from(uniqueVideos).map(JSON.parse).sort((a, b) => +a.timestamp - +b.timestamp);

    return videosToReturn;
  },

  // Instagram credential management
  saveInstagramCredentials: async (credentials) => {
    await client.set('instagram:credentials', JSON.stringify(credentials));
    return true;
  },

  getInstagramCredentials: async () => {
    const credString = await client.get('instagram:credentials') || '{}';
    return JSON.parse(credString);
  },

  deleteInstagramCredentials: async () => {
    await client.del('instagram:credentials');
    return true;
  }

};

export default db;
