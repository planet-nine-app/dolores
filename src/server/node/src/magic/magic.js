import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

sessionless.getKeys = async () => {
  return await db.getKeys();
};

const fountURL = 'http://localhost:3006/';

const MAGIC = {
  joinup: async (spell) => {
    const gateway = await MAGIC.gatewayForSpell(spell.spellName);
    spell.gateways.push(gateway);
    const spellName = spell.spell;

    const dolores = await db.getUser('dolores');
    const spellbooks = dolores.spellbooks;
    const spellbook = spellbooks.filter(spellbook => spellbook[spellName]).pop();
    if (!spellbook) {
      throw new Error('spellbook not found');
    }

    const spellEntry = spellbook[spellName];
    const currentIndex = spellEntry.destinations.indexOf(spellEntry.destinations.find(($) => $.stopName === 'dolores'));
    const nextDestination = spellEntry.destinations[currentIndex + 1].stopURL + spellName;

    const res = await MAGIC.forwardSpell(spell, nextDestination);
    const body = await res.json();

    if (!body.success) {
      return body;
    }

    if (!body.uuids) {
      body.uuids = [];
    }
    body.uuids.push({
      service: 'dolores',
      uuid: 'content'
    });

    return body;
  },

  linkup: async (spell) => {
    const gateway = await MAGIC.gatewayForSpell(spell.spellName);
    spell.gateways.push(gateway);

    const res = await MAGIC.forwardSpell(spell, fountURL);
    const body = await res.json();
    return body;
  },

  gatewayForSpell: async (spellName) => {
    const dolores = await db.getUser('dolores');
    const gateway = {
      timestamp: new Date().getTime() + '',
      uuid: dolores.fountUUID,
      minimumCost: 20,
      ordinal: dolores.ordinal || 0
    };

    const message = gateway.timestamp + gateway.uuid + gateway.minimumCost + gateway.ordinal;
    gateway.signature = await sessionless.sign(message);

    return gateway;
  },

  forwardSpell: async (spell, destination) => {
    return await fetch(destination, {
      method: 'post',
      body: JSON.stringify(spell),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // 🪄 MAGIC-ROUTED ENDPOINTS (No auth needed - resolver authorizes)

  doloresUserCreate: async (spell) => {
    try {
      const { pubKey } = spell.components;

      if (!pubKey) {
        return {
          success: false,
          error: 'Missing required field: pubKey'
        };
      }

      const foundUser = await db.putUser({ pubKey, videos: [] });

      return {
        success: true,
        user: foundUser
      };
    } catch (err) {
      console.error('doloresUserCreate error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  doloresUserPost: async (spell) => {
    try {
      const { uuid, post } = spell.components;

      if (!uuid || !post) {
        return {
          success: false,
          error: 'Missing required fields: uuid, post'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);

      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      await db.savePost(post);

      return {
        success: true,
        user: foundUser
      };
    } catch (err) {
      console.error('doloresUserPost error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  doloresAdminFeeds: async (spell) => {
    try {
      const { uuid, protocol, feeds } = spell.components;

      if (!uuid || !protocol || !feeds) {
        return {
          success: false,
          error: 'Missing required fields: uuid, protocol, feeds'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);

      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Admin check
      if (foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
        return {
          success: false,
          error: 'Admin access required'
        };
      }

      await db.saveFeeds(protocol, feeds);

      return {
        success: true
      };
    } catch (err) {
      console.error('doloresAdminFeeds error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  doloresUserShortFormVideo: async (spell) => {
    try {
      const { uuid, videoData, videoUUID } = spell.components;

      if (!uuid || !videoData || !videoUUID) {
        return {
          success: false,
          error: 'Missing required fields: uuid, videoData, videoUUID'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);

      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // In a real implementation, videoData would be base64 encoded or stored separately
      // For MAGIC spells, file uploads need special handling
      const timestamp = Date.now().toString();

      await db.putVideoMeta(videoUUID, { timestamp, tags: ['latest'] });

      foundUser.videos.push({
        timestamp,
        videoUUID
      });

      await db.saveUser(foundUser);

      return {
        success: true,
        videoUUID
      };
    } catch (err) {
      console.error('doloresUserShortFormVideo error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  doloresUserVideoTags: async (spell) => {
    try {
      const { uuid, videoUUID, tags } = spell.components;

      if (!uuid || !videoUUID || !tags) {
        return {
          success: false,
          error: 'Missing required fields: uuid, videoUUID, tags'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);

      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const videoMeta = await db.getVideoMeta(videoUUID);
      videoMeta.tags = [...(videoMeta.tags || []), ...(tags || [])];
      await db.putVideoMeta(videoUUID, videoMeta);

      return {
        success: true
      };
    } catch (err) {
      console.error('doloresUserVideoTags error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  doloresAdminInstagramCredentials: async (spell) => {
    try {
      const { uuid, credentials } = spell.components;

      if (!uuid || !credentials) {
        return {
          success: false,
          error: 'Missing required fields: uuid, credentials'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);

      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Admin check
      if (foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
        return {
          success: false,
          error: 'Admin access required'
        };
      }

      await db.saveInstagramCredentials(credentials);
      console.log('📷 Instagram credentials updated');

      return {
        success: true,
        message: 'Instagram credentials saved'
      };
    } catch (err) {
      console.error('doloresAdminInstagramCredentials error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  doloresAdminInstagramCredentialsDelete: async (spell) => {
    try {
      const { uuid } = spell.components;

      if (!uuid) {
        return {
          success: false,
          error: 'Missing required field: uuid'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);

      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Admin check
      if (foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
        return {
          success: false,
          error: 'Admin access required'
        };
      }

      await db.deleteInstagramCredentials();
      console.log('📷 Instagram credentials deleted');

      return {
        success: true,
        message: 'Instagram credentials deleted'
      };
    } catch (err) {
      console.error('doloresAdminInstagramCredentialsDelete error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  doloresAdminInstagramRefresh: async (spell) => {
    try {
      const { uuid } = spell.components;

      if (!uuid) {
        return {
          success: false,
          error: 'Missing required field: uuid'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);

      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Admin check
      if (foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
        return {
          success: false,
          error: 'Admin access required'
        };
      }

      // Import instagram module
      const instagramModule = await import('../protocols/instagram/instagram.js');
      const instagram = instagramModule.default;

      await instagram.refreshPosts();
      const stats = instagram.getStats();
      console.log('📷 Instagram manually refreshed:', stats);

      return {
        success: true,
        stats
      };
    } catch (err) {
      console.error('doloresAdminInstagramRefresh error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
};

export default MAGIC;
