// Planet Nine Audio Player
// Fetches and plays audio from Sockpuppet's music feed

(function() {
    'use strict';

    // Use relative path for feeds endpoint
    const FEED_URL = '/canimus/feeds';

    // State
    let allFeeds = [];
    let selectedFeedIndex = 0;
    let tracks = [];
    let currentTrackIndex = -1;
    let isPlaying = false;

    // DOM elements
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const currentTime = document.getElementById('currentTime');
    const totalTime = document.getElementById('totalTime');
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const trackAlbum = document.getElementById('trackAlbum');
    const albumArt = document.getElementById('albumArt');
    const trackList = document.getElementById('trackList');
    const purchaseBtn = document.getElementById('purchaseBtn');
    const purchaseIcon = document.getElementById('purchaseIcon');
    const purchaseLabel = document.getElementById('purchaseLabel');
    const feedSelector = document.getElementById('feedSelector');

    // Initialize
    async function init() {
        try {
            // Check for feedUrl query parameter
            const urlParams = new URLSearchParams(window.location.search);
            const feedUrl = urlParams.get('feedUrl');

            if (feedUrl) {
                // Direct feed loading - hide feed selector
                feedSelector.style.display = 'none';
                await loadDirectFeed(feedUrl);
                setupEventListeners();
            } else {
                // Normal behavior - load all feeds and show selector
                await loadFeeds();
                setupFeedSelector();
                setupEventListeners();

                // Load saved feed preference or default to first feed
                const savedFeedIndex = localStorage.getItem('selectedFeedIndex');
                if (savedFeedIndex !== null && parseInt(savedFeedIndex) < allFeeds.length) {
                    selectedFeedIndex = parseInt(savedFeedIndex);
                    feedSelector.value = selectedFeedIndex;
                }

                loadSelectedFeed();
            }
        } catch (error) {
            console.error('Failed to initialize player:', error);
            trackList.innerHTML = '<div class="loading">Failed to load feeds</div>';
        }
    }

    // Load all feeds from server
    async function loadFeeds() {
        const response = await fetch(FEED_URL);
        const data = await response.json();

        // Store all feeds
        allFeeds = data.feeds || [];
    }

    // Load a direct feed URL
    async function loadDirectFeed(url) {
        try {
            console.log('🎵 Loading direct feed:', url);

            // Check if feed was pre-loaded by server (avoids CORS issues)
            if (window.PRELOADED_FEED && window.PRELOADED_FEED_URL === url) {
                console.log('🎵 Using pre-loaded feed from server');
                const feed = window.PRELOADED_FEED;

                // Store as single feed
                allFeeds = [feed];
                selectedFeedIndex = 0;

                loadSelectedFeed();
                console.log('✅ Direct feed loaded successfully');
            } else {
                // Server must pre-load feed to avoid CORS
                console.error('❌ Feed was not pre-loaded by server. Cannot fetch client-side due to CORS.');
                trackList.innerHTML = '<div class="loading">Feed could not be loaded. Server error.</div>';
            }
        } catch (error) {
            console.error('❌ Failed to load direct feed:', error);
            trackList.innerHTML = '<div class="loading">Failed to load feed from URL</div>';
        }
    }

    // Setup feed selector dropdown
    function setupFeedSelector() {
        feedSelector.innerHTML = '';

        allFeeds.forEach((feed, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = feed.name || `Feed ${index + 1}`;
            feedSelector.appendChild(option);
        });

        // Add change event listener
        feedSelector.addEventListener('change', (e) => {
            selectedFeedIndex = parseInt(e.target.value);
            localStorage.setItem('selectedFeedIndex', selectedFeedIndex);

            // Stop current playback
            audioPlayer.pause();
            isPlaying = false;
            currentTrackIndex = -1;
            updatePlayPauseButton();

            // Load new feed
            loadSelectedFeed();
        });
    }

    // Load tracks from selected feed
    function loadSelectedFeed() {
        const feed = allFeeds[selectedFeedIndex];
        if (!feed) return;

        console.log('Loading feed:', feed.name);
        console.log('Feed has children:', feed.children?.length);

        // Parse the feed structure
        tracks = [];
        let trackNumber = 1;

        // Clear track list
        trackList.innerHTML = '';

        function parseChildren(children, albumName = null, albumCover = null) {
            children.forEach(item => {
                if (item.type === 'track') {
                    // Support both media array (Sockpuppet) and direct url (Bury the Needle)
                    // Support multiple audio formats: mp3, m4a, mpeg
                    const audioSrc = item.media?.find(m =>
                        m.type === 'audio/mp3' ||
                        m.type === 'audio/m4a' ||
                        m.type === 'audio/mpeg'
                    )?.src || item.url;
                    if (audioSrc) {
                        // Find purchase link
                        const purchaseLink = item.links?.find(link => link.rel === 'purchase');

                        tracks.push({
                            number: trackNumber++,
                            title: item.name,
                            artist: item.artist || item.Artist || 'Unknown Artist',
                            album: albumName || 'Single',
                            duration: item.duration || item.Duration || 0,
                            src: audioSrc,
                            cover: item.images?.cover?.src || albumCover || '',
                            description: stripHtml(item.description || ''),
                            purchaseLink: purchaseLink || null
                        });
                    }
                }

                if (item.type === 'album') {
                    const albumName = item.name;
                    // Support both images.cover.src (Sockpuppet) and images[0].src (Bury the Needle)
                    const albumCover = item.images?.cover?.src || item.images?.[0]?.src || '';

                    // Add album header
                    const albumHeader = document.createElement('div');
                    albumHeader.className = 'album-header';
                    albumHeader.innerHTML = `
                        <div class="album-name">${escapeHtml(albumName)}</div>
                        ${item.description ? `<div class="album-description">${stripHtml(item.description)}</div>` : ''}
                    `;
                    trackList.appendChild(albumHeader);

                    if (item.children) {
                        parseChildren(item.children, albumName, albumCover);
                    }
                }

                if (item.children && item.type !== 'album') {
                    parseChildren(item.children, albumName, albumCover);
                }
            });
        }

        // Parse the selected feed's children
        if (feed.children) {
            parseChildren(feed.children);
        }

        console.log('Parsed tracks:', tracks.length);
        renderTrackList();
    }

    // Render track list
    function renderTrackList() {
        // Clear loading message but keep album headers
        const loadingDiv = trackList.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }

        tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.index = index;

            trackItem.innerHTML = `
                <div class="track-number">${track.number}</div>
                <div class="track-item-info">
                    <div class="track-item-title">${escapeHtml(track.title)}</div>
                    <div class="track-item-meta">${escapeHtml(track.album)}</div>
                </div>
                <div class="track-duration">${formatTime(track.duration)}</div>
            `;

            trackItem.addEventListener('click', () => {
                playTrack(index);
            });

            trackList.appendChild(trackItem);
        });
    }

    // Play track
    function playTrack(index) {
        if (index < 0 || index >= tracks.length) return;

        currentTrackIndex = index;
        const track = tracks[index];

        // Update UI
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        trackAlbum.textContent = track.album;
        albumArt.src = track.cover || '';
        albumArt.style.display = track.cover ? 'block' : 'none';

        // Update purchase button
        if (track.purchaseLink) {
            purchaseBtn.href = track.purchaseLink.href;
            purchaseLabel.textContent = track.purchaseLink.label || 'Purchase';

            // Set icon if available
            if (track.purchaseLink.icon?.src) {
                purchaseIcon.src = track.purchaseLink.icon.src;
                purchaseIcon.alt = track.purchaseLink.icon.alt || '';
                purchaseIcon.style.display = 'block';
            } else {
                purchaseIcon.style.display = 'none';
            }

            purchaseBtn.classList.add('visible');
        } else {
            purchaseBtn.classList.remove('visible');
        }

        // Update track list highlighting
        document.querySelectorAll('.track-item').forEach((item, i) => {
            item.classList.toggle('playing', i === index);
        });

        // Load and play audio
        audioPlayer.src = track.src;
        audioPlayer.play();
        isPlaying = true;
        updatePlayPauseButton();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Play/pause button
        playPauseBtn.addEventListener('click', () => {
            if (currentTrackIndex === -1 && tracks.length > 0) {
                playTrack(0);
            } else if (isPlaying) {
                audioPlayer.pause();
                isPlaying = false;
            } else {
                audioPlayer.play();
                isPlaying = true;
            }
            updatePlayPauseButton();
        });

        // Previous button
        prevBtn.addEventListener('click', () => {
            if (currentTrackIndex > 0) {
                playTrack(currentTrackIndex - 1);
            }
        });

        // Next button
        nextBtn.addEventListener('click', () => {
            if (currentTrackIndex < tracks.length - 1) {
                playTrack(currentTrackIndex + 1);
            }
        });

        // Audio events
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', () => {
            totalTime.textContent = formatTime(audioPlayer.duration);
        });
        audioPlayer.addEventListener('ended', () => {
            // Auto-play next track
            if (currentTrackIndex < tracks.length - 1) {
                playTrack(currentTrackIndex + 1);
            } else {
                isPlaying = false;
                updatePlayPauseButton();
            }
        });

        // Progress bar click
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioPlayer.currentTime = audioPlayer.duration * percent;
        });
    }

    // Update play/pause button
    function updatePlayPauseButton() {
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playPauseBtn.title = 'Pause';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playPauseBtn.title = 'Play';
        }
    }

    // Update progress bar
    function updateProgress() {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressFill.style.width = percent + '%';
            currentTime.textContent = formatTime(audioPlayer.currentTime);
        }
    }

    // Format time (seconds to mm:ss)
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Strip HTML tags
    function stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Start the player
    init();
})();
