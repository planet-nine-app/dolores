import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import store from 'memorystore';
import { createHash } from 'node:crypto';
import db from './src/persistence/db.js';
import bsky from './src/protocols/at-protocol/bluesky.js';
import instagram from './src/protocols/instagram/instagram.js';
import fount from 'fount-js';
import bdo from 'bdo-js';
import sessionless from 'sessionless-node';
import gateway from 'magic-gateway-js';

bsky.refreshPosts().then(_ => console.log(bsky));
instagram.refreshPosts().then(_ => console.log('📷 Instagram initialized:', instagram.getStats()));

const MemoryStore = store(session);

const allowedTimeDifference = process.env.ALLOWED_TIME_DIFFERENCE || 300000; // keep this relaxed for now

const app = express();
app.use(express.json());

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Range', 'If-Match', 'If-None-Match', 'Content-Type', 'Authorization'],
  exposedHeaders: [
    'Content-Length',
    'Content-Range',
    'Content-Type',
    'Accept-Ranges'
  ],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

app.options('*', (req, res) => {
  res.status(204).send();
});

const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';
fount.baseURL = process.env.LOCALHOST ? 'http://localhost:3006/' : `https://${SUBDOMAIN}.fount.allyabase.com/`;
bdo.baseURL = process.env.LOCALHOST ? 'http://localhost:3003/' : `https://${SUBDOMAIN}.bdo.allyabase.com/`;
const bdoHashInput = `${SUBDOMAIN}dolores`;

const bdoHash = createHash('sha256').update(bdoHashInput).digest('hex');

const repeat = (func) => {
  setTimeout(func, 2000);
};

let fountUser;

const bootstrap = async () => {
  try {
    fountUser = await fount.createUser(db.saveKeys, db.getKeys);
console.log('f', fountUser);
    const bdoUUID = await bdo.createUser(bdoHash, {}, () => {}, db.getKeys);
console.log('b', bdoUUID);
    const spellbooks = await bdo.getSpellbooks(bdoUUID, bdoHash);
console.log('there are ' + spellbooks.length + ' spellbooks');
    const dolores = {
      uuid: 'dolores',
      fountUUID: fountUser.uuid,
      fountPubKey: fountUser.pubKey,
      bdoUUID,
      spellbooks
    };

    if(!dolores.fountUUID || !dolores.bdoUUID || !spellbooks) {
      throw new Error('bootstrap failed');
    }

    await db.saveUser(dolores);
  } catch(err) {
console.warn(err);
    repeat(bootstrap);
  }
};

repeat(bootstrap);

app.use(fileUpload({
    createParentPath: true
}));

app.use((req, res, next) => {
  const requestTime = +req.query.timestamp || +req.body.timestamp;
  const now = new Date().getTime();
  if(Math.abs(now - requestTime) > allowedTimeDifference) {
    return res.send({error: 'no time like the present'});
  }
  next();
});

app.use((req, res, next) => {
  console.log('\n\n', req.body, '\n\n');
  next();
});

app.put('/user/create', async (req, res) => {
  try {
    const pubKey = req.body.pubKey;
    const message = req.body.timestamp +  pubKey;
    const signature = req.body.signature;

    if(!signature || !sessionless.verifySignature(signature, message, pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const foundUser = await db.putUser({ pubKey, videos: [] });
    res.send(foundUser);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/user/:uuid', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.query.timestamp;
    const signature = req.query.signature;
    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(req.params.uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    res.send(foundUser);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/post', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.body.timestamp;
    const post = req.body.post;
    const signature = req.body.signature;
    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(req.params.uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    await db.savePost(post);

    res.send(foundUser);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/admin/:uuid/feeds', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.body.timestamp;
    const protocol = req.body.protocol;
    const feeds = req.body.feeds;
    const signature = req.body.signatue;
    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(req.params.uuid);

    if(founderUser.pubKey !== process.env.ADMIN_PUB_KEY) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    await db.saveFeeds(protocol, feeds);

    res.send({success: true});
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/short-form/video', async (req, res) => {
  try {
  const uuid = req.params.uuid;
  const timestamp = req.headers['x-pn-timestamp'];
  const signature = req.headers['x-pn-signature'];
  const message = timestamp + uuid;

  const foundUser = await db.getUserByUUID(uuid);

  if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
    res.status(403);
    return res.send({error: 'auth error'});
  }

  if (!req.files) {
    throw new Error('No video');
  }

  const video = req.files.video;
  const videoUUID = sessionless.generateUUID();
  await video.mv('./video/' + videoUUID);
  await db.putVideoMeta(videoUUID, {timestamp, tags: ['latest']});

  foundUser.videos.push({
    timestamp,
    videoUUID 
  });

  await db.saveUser(foundUser);
  
console.log('should send back success');
  res.send({success: true});
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.use(session({ 
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: false,
  secret: 'seize the means of production!!!', 
  cookie: { maxAge: 60000000 }
}));

app.get('/user/:uuid/feed', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.query.timestamp;
console.log('beofre split', req.query.tags);
    const tags = req.query.tags.split('+');
console.log('after split', tags);
    const signature = req.query.signature;
    const message = timestamp + uuid + tags.join('');

    const foundUser = await db.getUserByUUID(uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
console.log('auth failed');
      res.status(403);
      return res.send({error: 'auth error'});
    }

    let videos = [];

    if(tags.length === 0 || JSON.stringify(tags) === JSON.stringify([ '' ])) {
      videos = (await db.getLatestVideos(50)) || [];
    } else {
      videos = (await db.getVideosForTags(tags)) || [];
    }

console.log('videos looks like', videos, {videos});

    // Refresh protocols if needed (older than 10 minutes)
    if(+timestamp - bsky.lastRefresh > (10 * 60 * 1000)) {
      bsky.refreshPosts();
    }
    if(+timestamp - instagram.lastRefresh > (10 * 60 * 1000)) {
      instagram.refreshPosts();
    }

    // Combine posts from all protocols
    const combinedFeed = {
      ...bsky,
      instagram: {
        videoPosts: instagram.getVideoPosts(),
        picPosts: instagram.getPicPosts(),
        genericPosts: instagram.getGenericPosts(),
        allPosts: instagram.getAllPosts(),
        stats: instagram.getStats()
      },
      // Combined all posts from all protocols
      allProtocolPosts: [
        ...bsky.allPosts,
        ...instagram.getAllPosts()
      ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) // Sort by timestamp, newest first
    };

    res.send(combinedFeed);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/video/:videoUUID/tags', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const videoUUID = req.params.videoUUID;
    const tags = req.body.tags;
    const timestamp = req.body.timestamp;
    const signature = req.body.signature;
    const message = timestamp + uuid + videoUUID + tags.join('');

    const isAuthenticated = req.session.uuid === uuid;
    if(!isAuthenticated) {
      const foundUser = await db.getUserByUUID(uuid);

      if(!sessionless.verifySignature(signature, message, foundUser.pubKey)) {
        res.status(403);
        return res.send({error: 'auth error'});
      }
    }

    const videoMeta = await db.getVideoMeta(videoUUID);
    videoMeta.tags = [...videoMeta.tags, ...(tags || [])];
    await db.putVideoMeta(videoUUID, videoMeta);

    res.send({success: true});
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/user/:uuid/short-form/video/:videoUUID', async (req, res) => {
  try {
    const foundUser = await db.getUserByUUID(req.params.uuid);

    if(!req.session.uuid) {
      req.session.regenerate((err) => {
console.warn(err);
console.log('session', req.session);
      });
    
      const keys = await sessionless.generateKeys(() => {}, () => {});

      const user = {
        pubKey: keys.pubKey,
        keys
      };

      req.session.uuid = user.uuid;
      await db.saveUser(user);
    }

console.log('foundUser\'s videos look like: ', foundUser.videos);
    const videoUUID = req.params.videoUUID;
    
    if(!videoUUID) {
      throw new Error('not found');
    }

    const videoPath = './video/' + videoUUID;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

console.log('statSize is: ', stat.size);

    if(stat.size < 500) {
      const vidURI = fs.readFileSync(videoPath);
      return res.redirect(301, vidURI);
    }

    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'x-pn-video-uuid': videoUUID
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }    
});

// Serve form widget JavaScript
app.get('/post-widget.js', (req, res) => {
  const widgetCode = fs.readFileSync(path.join(process.cwd(), 'dolores/public/post-widget.js'), 'utf8');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(widgetCode);
});

// Serve form widget CSS
app.get('/post-widget.css', (req, res) => {
  const widgetCSS = fs.readFileSync(path.join(process.cwd(), 'dolores/public/post-widget.css'), 'utf8');
  res.setHeader('Content-Type', 'text/css');
  res.send(widgetCSS);
});

app.get('/post-widget-docs.html', (req, res) => {
  const docsHTML = fs.readFileSync(path.join(process.cwd(), 'dolores/public/post-widget-docs.html'), 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(docsHTML);
});

// Instagram credential management endpoints
app.put('/admin/:uuid/instagram/credentials', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.body.timestamp;
    const credentials = req.body.credentials; // {username, password}
    const signature = req.body.signature;
    const message = timestamp + uuid + (credentials.username || '');

    const foundUser = await db.getUserByUUID(uuid);

    // Only allow admin to set Instagram credentials
    if(foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
      res.status(403);
      return res.send({error: 'admin access required'});
    }

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    await db.saveInstagramCredentials(credentials);
    console.log('📷 Instagram credentials updated');

    res.send({success: true, message: 'Instagram credentials saved'});
  } catch(err) {
    console.warn('Instagram credentials error:', err);
    res.status(500);
    res.send({error: 'server error'});
  }
});

app.delete('/admin/:uuid/instagram/credentials', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.body.timestamp;
    const signature = req.body.signature;
    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(uuid);

    if(foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
      res.status(403);
      return res.send({error: 'admin access required'});
    }

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    await db.deleteInstagramCredentials();
    console.log('📷 Instagram credentials deleted');

    res.send({success: true, message: 'Instagram credentials deleted'});
  } catch(err) {
    console.warn('Instagram credentials deletion error:', err);
    res.status(500);
    res.send({error: 'server error'});
  }
});

// Instagram manual refresh endpoint
app.post('/admin/:uuid/instagram/refresh', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.body.timestamp;
    const signature = req.body.signature;
    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(uuid);

    if(foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
      res.status(403);
      return res.send({error: 'admin access required'});
    }

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    await instagram.refreshPosts();
    const stats = instagram.getStats();
    console.log('📷 Instagram manually refreshed:', stats);

    res.send({success: true, stats});
  } catch(err) {
    console.warn('Instagram refresh error:', err);
    res.status(500);
    res.send({error: 'server error'});
  }
});

app.listen(process.env.PORT || 3005);
