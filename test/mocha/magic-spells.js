import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import fount from 'fount-js';

const baseURL = process.env.SUB_DOMAIN ? `https://${process.env.SUB_DOMAIN}.fount.allyabase.com/` : 'http://127.0.0.1:3006/';
fount.baseURL = baseURL;

let keys = {};
let fountUser = {};
let doloresUser = {};
let videoUUID = '';

describe('Dolores MAGIC Spell Tests', () => {

  before(async () => {
    // Generate keys for testing
    keys = await sessionless.generateKeys(() => { return keys; }, () => { return keys; });

    // Create fount user for spell casting
    fountUser = await fount.createUser(() => keys, () => keys);
    console.log('Created fount user:', fountUser.uuid);
  });

  it('should create user via doloresUserCreate spell', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'doloresUserCreate',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 0,
      components: {
        pubKey: keys.pubKey
      }
    };

    // Sign the spell
    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    // Cast the spell
    const result = await fount.castSpell('doloresUserCreate', spell);

    console.log('doloresUserCreate result:', result);

    result.should.have.property('success', true);
    result.should.have.property('user');
    result.user.should.have.property('pubKey', keys.pubKey);
    result.user.should.have.property('videos');

    doloresUser = result.user;
  });

  it('should save post via doloresUserPost spell', async () => {
    const timestamp = Date.now().toString();

    const testPost = {
      content: 'Test post from MAGIC spell!',
      timestamp: Date.now()
    };

    const spell = {
      spell: 'doloresUserPost',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 1,
      components: {
        uuid: doloresUser.fountUUID,
        post: testPost
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresUserPost', spell);

    console.log('doloresUserPost result:', result);

    result.should.have.property('success', true);
    result.should.have.property('user');
  });

  it('should upload short-form video via doloresUserShortFormVideo spell', async () => {
    const timestamp = Date.now().toString();
    videoUUID = 'test-video-' + timestamp;

    const videoData = 'base64-encoded-video-data-here';

    const spell = {
      spell: 'doloresUserShortFormVideo',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 2,
      components: {
        uuid: doloresUser.fountUUID,
        videoData: videoData,
        videoUUID: videoUUID
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresUserShortFormVideo', spell);

    console.log('doloresUserShortFormVideo result:', result);

    result.should.have.property('success', true);
    result.should.have.property('videoUUID', videoUUID);
  });

  it('should add video tags via doloresUserVideoTags spell', async () => {
    const timestamp = Date.now().toString();

    const tags = ['magic', 'test', 'automated'];

    const spell = {
      spell: 'doloresUserVideoTags',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 3,
      components: {
        uuid: doloresUser.fountUUID,
        videoUUID: videoUUID,
        tags: tags
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresUserVideoTags', spell);

    console.log('doloresUserVideoTags result:', result);

    result.should.have.property('success', true);
  });

  it('should fail to create user with missing pubKey', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'doloresUserCreate',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 4,
      components: {
        // Missing pubKey
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresUserCreate', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to save post with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'doloresUserPost',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 5,
      components: {
        uuid: doloresUser.fountUUID
        // Missing post
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresUserPost', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to save feeds with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'doloresAdminFeeds',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 6,
      components: {
        uuid: doloresUser.fountUUID
        // Missing protocol and feeds
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresAdminFeeds', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to upload video with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'doloresUserShortFormVideo',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 7,
      components: {
        uuid: doloresUser.fountUUID
        // Missing videoData and videoUUID
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresUserShortFormVideo', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to add video tags with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'doloresUserVideoTags',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 8,
      components: {
        uuid: doloresUser.fountUUID
        // Missing videoUUID and tags
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresUserVideoTags', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail Instagram credentials with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'doloresAdminInstagramCredentials',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 9,
      components: {
        uuid: doloresUser.fountUUID
        // Missing credentials
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('doloresAdminInstagramCredentials', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

});
