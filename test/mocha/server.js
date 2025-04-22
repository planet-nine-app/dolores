import { should } from 'chai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(process.env);

const baseURL = process.env.SUB_DOMAIN ? `https://${process.env.SUB_DOMAIN}.dolores.allyabase.com/` : 'http://127.0.0.1:3007/';

const get = async function(path) {
  console.info("Getting " + path);
  return await superAgent.get(path).set('Content-Type', 'application/json');
};

const put = async function(path, body) {
  console.info("Putting " + path);
  return await superAgent.put(path).send(body).set('Content-Type', 'application/json');
};

const post = async function(path, body) {
  console.info("Posting " + path);
console.log(body);
  return await superAgent.post(path).send(body).set('Content-Type', 'application/json');
};

const _delete = async function(path, body) {
  //console.info("deleting " + path);
  return await superAgent.delete(path).send(body).set('Content-Type', 'application/json');
};

let savedUser = {};
let keys = {};
let keysToReturn = {};
let feed = [];

it('should register a user', async () => {
  keys = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});
/*  keys = {
    privateKey: 'd6bfebeafa60e27114a40059a4fe82b3e7a1ddb3806cd5102691c3985d7fa591',
    pubKey: '03f60b3bf11552f5a0c7d6b52fcc415973d30b52ab1d74845f1b34ae8568a47b5f'
  };*/
  const payload = {
    timestamp: new Date().getTime() + '',
    pubKey: keys.pubKey,
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey);

  const res = await put(`${baseURL}user/create`, payload);
console.log(res.body);
  savedUser = res.body;
  res.body.uuid.length.should.equal(36);
});

it('should get user with account id', async () => {
  const timestamp = new Date().getTime() + '';

  const signature = await sessionless.sign(timestamp + savedUser.uuid);

  const res = await get(`${baseURL}user/${savedUser.uuid}?timestamp=${timestamp}&signature=${signature}`);
  res.body.uuid.should.equal(savedUser.uuid);
  savedUser = res.body;
});

it('should put an mp4 video', async () => {
  const timestamp = new Date().getTime() + '';

  const message = timestamp + savedUser.uuid;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/short-form/video`)
    .attach('video', join(__dirname, 'test.mp4'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
}).timeout(60000);

it('should put a mov video', async () => {
  const timestamp = new Date().getTime() + '';

  const message = timestamp + savedUser.uuid;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/short-form/video`)
    .attach('video', join(__dirname, 'test.mov'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
}).timeout(60000);

// Need to figure out how to handle admin privelages.
/*it('should save feeds', async () => {
  const timestamp = new Date().getTime() + '';
  const 
});*/

it('should get a feed of latest', async () => {
  const timestamp = new Date().getTime() + '';
  const tags = [];
  const message = timestamp + savedUser.uuid + tags.join('');

  const signature = await sessionless.sign(message);

  const res = await get(`${baseURL}user/${savedUser.uuid}/feed?timestamp=${timestamp}&tags=${tags.join('+')}&signature=${signature}`);
  feed = res.body;
console.log('feed', feed);
  res.body.videoPosts.length.should.equal(2);
});

it('should get atproto video', async () => {
  const videoMeta = feed.videoPosts.filter($ => $.post.uuid.length === 59)[0].post;
console.log('videoMeta', videoMeta);
  const res = await superAgent.get(`${baseURL}user/${savedUser.uuid}/short-form/video/${videoMeta.uuid}`);
console.log(res.status);
//  savedUser['set-cookie'] = res.headers['set-cookie'];
//  const videoUUID = res.headers['x-pn-video-uuid'];
//console.log(videoUUID);
  res.status.should.equal(200);
});

it('should get video', async () => {
  const videoMeta = feed.videoPosts.filter($ => $.post.uuid.length === 36)[0];
console.log('getting ' + `${baseURL}user/${savedUser.uuid}/short-form/video/${videoMeta.uuid}`);
  const res = await superAgent.get(`${baseURL}user/${savedUser.uuid}/short-form/video/${videoMeta.uuid}`);
console.log(res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  savedUser.videos = {video1: res.headers['x-pn-video-uuid']};
console.log('get video res', res);
  savedUser.videos.video1.length.should.equal(36);
}).timeout(60000);

it('should get video', async () => {
  const videoMeta = feed.videoPosts.filter($ => $.post.uuid.length === 36)[1];
  const res = await superAgent.get(`${baseURL}user/${savedUser.uuid}/short-form/video/${videoMeta.uuid}`);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  savedUser.videos.video2 = res.headers['x-pn-video-uuid'];
  savedUser.videos.video2.length.should.equal(36);
}).timeout(60000);

it('should add tags to video1', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    uuid: savedUser.uuid,
    videoUUID: savedUser.videos.video1,
    tags: ['foo', 'bar']
  };

  const message = payload.timestamp + payload.uuid + payload.videoUUID + payload.tags.join('');
  
  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${payload.uuid}/video/${payload.videoUUID}/tags`, payload);
  res.body.success.should.equal(true);
});

it('should add tags to video2', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    uuid: savedUser.uuid,
    videoUUID: savedUser.videos.video2,
    tags: ['foo', 'bop']
  };

  const message = payload.timestamp + payload.uuid + payload.videoUUID + payload.tags.join('');
  
  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${payload.uuid}/video/${payload.videoUUID}/tags`, payload);
  res.body.success.should.equal(true);
});

it('should get a feed', async () => {
  const timestamp = new Date().getTime() + '';
  const tags = ['foo'];
  const message = timestamp + savedUser.uuid + tags.join('');

  const signature = await sessionless.sign(message);

  const res = await get(`${baseURL}user/${savedUser.uuid}/feed?timestamp=${timestamp}&tags=${tags.join('+')}&signature=${signature}`);
  res.body.videos.length.should.equal(2);
});


