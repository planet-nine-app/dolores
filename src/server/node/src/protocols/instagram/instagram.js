import fs from 'fs';
import { IgApiClient } from 'instagram-private-api';
import db from '../../persistence/db.js';

const PROTOCOL = 'instagram';
const MAX_POSTS = 500;

// Map Instagram media to Dolores post format
const nullify = (media) => {
  const isVideo = media.media_type === 2; // 1 = photo, 2 = video, 8 = carousel
  const isCarousel = media.media_type === 8;
  
  // Extract images/videos from media
  let images = [];
  let videoUrl = null;
  
  if (isVideo && media.video_versions && media.video_versions.length > 0) {
    videoUrl = media.video_versions[0].url;
  } else if (media.image_versions2 && media.image_versions2.candidates) {
    images = media.image_versions2.candidates.map(img => ({
      url: img.url,
      width: img.width,
      height: img.height
    }));
  } else if (isCarousel && media.carousel_media) {
    // Handle carousel posts with multiple images/videos
    media.carousel_media.forEach(item => {
      if (item.media_type === 2 && item.video_versions) {
        if (!videoUrl) videoUrl = item.video_versions[0].url;
      } else if (item.image_versions2 && item.image_versions2.candidates) {
        images = images.concat(item.image_versions2.candidates.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height
        })));
      }
    });
  }

  return {
    uuid: media.id || media.pk,
    description: media.caption ? media.caption.text : '',
    images: images.length > 0 ? images : null,
    url: videoUrl,
    username: media.user ? media.user.username : null,
    timestamp: media.taken_at ? media.taken_at * 1000 : Date.now(), // Convert to milliseconds
    likes: media.like_count || 0,
    comments: media.comment_count || 0,
    protocol: PROTOCOL,
    originalUrl: `https://www.instagram.com/p/${media.code}/`
  };
};

const instagram = {
  videoPosts: [],
  picPosts: [],
  genericPosts: [],
  allPosts: [],
  lastRefresh: new Date().getTime(),
  client: null,
  isLoggedIn: false,

  // Initialize Instagram client
  initialize: async () => {
    if (!instagram.client) {
      instagram.client = new IgApiClient();
    }
    
    // Try to login if credentials are available
    const credentials = await db.getInstagramCredentials();
    if (credentials && credentials.username && credentials.password && !instagram.isLoggedIn) {
      try {
        instagram.client.state.generateDevice(credentials.username);
        await instagram.client.account.login(credentials.username, credentials.password);
        instagram.isLoggedIn = true;
        console.log('✅ Instagram client logged in successfully');
      } catch (error) {
        console.warn('⚠️ Instagram login failed:', error.message);
        // Continue without login for public content
      }
    }
  },

  // Refresh posts from Instagram feeds
  refreshPosts: async () => {
    if (!fs.existsSync('./video')) {
      fs.mkdirSync('./video');
    }

    await instagram.initialize();

    if (!instagram.client) {
      console.warn('Instagram client not initialized');
      return;
    }

    try {
      const instagramFeeds = await db.getFeeds(PROTOCOL);
      
      const videoFeeds = instagramFeeds.videoFeeds || [];
      const picFeeds = instagramFeeds.picFeeds || [];
      const genericFeeds = instagramFeeds.genericFeeds || [];
      
      // Default feeds if none configured
      if (genericFeeds.length === 0) {
        // These would be configured usernames or hashtags to follow
        genericFeeds.push('#planetnine');
        genericFeeds.push('#socialmedia');
      }

      console.log('🔄 Refreshing Instagram feeds...');
      
      // Process feeds (hashtags and usernames)
      for (const feed of genericFeeds) {
        await instagram.processFeed(feed);
      }

      instagram.lastRefresh = new Date().getTime();
      console.log(`✅ Instagram refresh complete. Total posts: ${instagram.allPosts.length}`);

    } catch (error) {
      console.warn('Instagram feed refresh error:', error);
    }
  },

  // Process individual feed (hashtag or username)
  processFeed: async (feedName) => {
    try {
      let media = [];
      
      if (feedName.startsWith('#')) {
        // Process hashtag
        const hashtag = feedName.substring(1);
        console.log(`📷 Fetching hashtag: ${hashtag}`);
        
        const hashtagFeed = instagram.client.feed.tag(hashtag);
        const hashtagMedia = await hashtagFeed.items();
        media = hashtagMedia.slice(0, 20); // Limit to 20 posts per hashtag
        
      } else if (feedName.startsWith('@')) {
        // Process username
        const username = feedName.substring(1);
        console.log(`👤 Fetching user: ${username}`);
        
        const userId = await instagram.client.user.getIdByUsername(username);
        const userFeed = instagram.client.feed.user(userId);
        const userMedia = await userFeed.items();
        media = userMedia.slice(0, 20); // Limit to 20 posts per user
        
      } else {
        // Treat as username without @
        console.log(`👤 Fetching user: ${feedName}`);
        
        const userId = await instagram.client.user.getIdByUsername(feedName);
        const userFeed = instagram.client.feed.user(userId);
        const userMedia = await userFeed.items();
        media = userMedia.slice(0, 20); // Limit to 20 posts per user
      }

      // Process and categorize media
      media.forEach(item => {
        const remapped = nullify(item);
        
        // Categorize by media type
        if (remapped.url) {
          // Has video URL - it's a video post
          instagram.videoPosts.push(remapped);
        } else if (remapped.images && remapped.images.length > 0) {
          // Has images - it's a picture post
          instagram.picPosts.push(remapped);
        } else {
          // Generic post (text, etc.)
          instagram.genericPosts.push(remapped);
        }
        
        // Add to all posts
        instagram.allPosts.push(remapped);
        
        // Maintain max posts limit
        const noop = () => {};
        instagram.videoPosts.length > MAX_POSTS ? instagram.videoPosts.shift() : noop();
        instagram.picPosts.length > MAX_POSTS ? instagram.picPosts.shift() : noop();
        instagram.genericPosts.length > MAX_POSTS ? instagram.genericPosts.shift() : noop();
        instagram.allPosts.length > MAX_POSTS ? instagram.allPosts.shift() : noop();
      });

    } catch (error) {
      console.warn(`Instagram feed processing error for ${feedName}:`, error.message);
    }
  },

  // Get posts by type
  getVideoPosts: () => instagram.videoPosts,
  getPicPosts: () => instagram.picPosts,
  getGenericPosts: () => instagram.genericPosts,
  getAllPosts: () => instagram.allPosts,
  
  // Get stats
  getStats: () => ({
    videoPosts: instagram.videoPosts.length,
    picPosts: instagram.picPosts.length,
    genericPosts: instagram.genericPosts.length,
    totalPosts: instagram.allPosts.length,
    lastRefresh: instagram.lastRefresh,
    isLoggedIn: instagram.isLoggedIn
  })
};

console.log('📷 Instagram protocol initialized');

export default instagram;