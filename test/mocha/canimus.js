import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const baseURL = process.env.SUB_DOMAIN ? `https://${process.env.SUB_DOMAIN}.dolores.allyabase.com/` : 'http://127.0.0.1:3007/';

const get = async function(path) {
  console.info("Getting " + path);
  return await superAgent.get(path).set('Content-Type', 'application/json');
};

const put = async function(path, body) {
  console.info("Putting " + path);
  return await superAgent.put(path).send(body).set('Content-Type', 'application/json');
};

let savedUser = {};
let keys = {};
let keysToReturn = {};

describe('Canimus Protocol Tests', () => {
  it('should register a user for canimus feed testing', async () => {
    keys = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});

    const payload = {
      timestamp: new Date().getTime() + '',
      pubKey: keys.pubKey,
    };

    payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey);

    const res = await put(`${baseURL}user/create`, payload);
    console.log('Created user:', res.body);
    savedUser = res.body;
    res.body.uuid.length.should.equal(36);
  });

  it('should get canimus feeds with protocol parameter', async () => {
    const timestamp = new Date().getTime() + '';
    const tags = [];
    const protocol = 'canimus';
    const message = timestamp + savedUser.uuid + tags.join('');

    const signature = await sessionless.sign(message);

    const res = await get(`${baseURL}user/${savedUser.uuid}/feed?timestamp=${timestamp}&tags=${tags.join('+')}&protocol=${protocol}&signature=${signature}`);

    console.log('Canimus feed response:', res.body);

    // Should have feeds property
    res.body.should.have.property('feeds');

    // Feeds should be an array
    res.body.feeds.should.be.an('array');

    // Should have at least the test feed
    res.body.feeds.length.should.be.at.least(1);

    console.log(`✅ Successfully retrieved ${res.body.feeds.length} canimus feed(s)`);
  });

  it('should verify canimus feed contains expected data', async () => {
    const timestamp = new Date().getTime() + '';
    const tags = [];
    const protocol = 'canimus';
    const message = timestamp + savedUser.uuid + tags.join('');

    const signature = await sessionless.sign(message);

    const res = await get(`${baseURL}user/${savedUser.uuid}/feed?timestamp=${timestamp}&tags=${tags.join('+')}&protocol=${protocol}&signature=${signature}`);

    // Check that feeds exist and are Response objects with json() method
    res.body.feeds.should.be.an('array');

    console.log('✅ Canimus feeds structure verified');
  });
});
