import { createClient } from './client.js';
import sessionless from 'sessionless-node';
  
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
    return parsedUser; 
  },

  getUserByPublicKey: async (pubKey) => {
    const uuid = await client.get(`pubKey:${pubKey}`);
    const user = await client.get(`user:${uuid}`);
    if(!user) {
      throw new Error('not found');
    }
    let parsedUser = JSON.parse(user);
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

  putVideo: async (user, video) => {
console.log('putting video', video);
    const uuid = user.uuid;
    video.uuid = uuid;
    await client.set(`${user.uuid}:video:${video.title}`, JSON.stringify(video));
    
    const titlesJSON = (await client.get(`videos:${uuid}`)) || '{}';
    const titles = JSON.parse(titlesJSON);
    titles[video.title] = video;
    await client.set(`videos:${uuid}`, JSON.stringify(titles));
    return video;
  },

  getVideo: async (uuid, title) => {
    const video = await client.get(`${uuid}:video:${title}`);
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

    return videosToReturn;
  },

  getLatestVideos: async (total) => {
    const tagsString = await client.get('videoMetaTags') || '{}';
    const tags = JSON.parse(tagsString);
    const tagsArray = Object.keys(tags);

    let metaArray = [];
    tagsArray.forEach(tag => {
      metaArray = [...metaArray, ...tags[tag]];
    });

    const uniqueVideos = new Set(metaArray.map(item => JSON.stringify(item)));

    const videosToReturn = Array.from(uniqueVideos).sort((a, b) => +a.timestamp - +b.timestamp).map(JSON.parse);

    return videosToReturn;
  }

};

export default db;
