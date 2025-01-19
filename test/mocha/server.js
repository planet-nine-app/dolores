import { should } from 'chai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.DEV ? 'https://dev.dolores.allyabase.com/' : 'http://127.0.0.1:3007/';

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
  const title = 'My mp4 video';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/short-form/${encodeURIComponent(title)}/video`)
    .attach('video', join(__dirname, 'test.mp4'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
});

it('should put a mov video', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'My mov video';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/short-form/${encodeURIComponent(title)}/video`)
    .attach('video', join(__dirname, 'test.mov'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
});

it('should get video', async () => {
console.log('getting the video at: ', `${baseURL}user/${savedUser.uuid}/short-form/${encodeURIComponent('My mp4 video')}/video`);
  const res = await superAgent.get(`${baseURL}user/${savedUser.uuid}/short-form/${encodeURIComponent('My mp4 video')}/video`);
console.log(res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  savedUser.videos = {video1: res.headers['x-pn-video-uuid']};
console.log('get video res', res);
  savedUser.videos.video1.length.should.equal(36);
});

it('should get video', async () => {
console.log('getting the video at: ', `${baseURL}user/${savedUser.uuid}/short-form/${encodeURIComponent('My mov video')}/video`);
  const res = await superAgent.get(`${baseURL}user/${savedUser.uuid}/short-form/${encodeURIComponent('My mov video')}/video`);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  savedUser.videos.video2 = res.headers['x-pn-video-uuid'];
  savedUser.videos.video2.length.should.equal(36);
});

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
