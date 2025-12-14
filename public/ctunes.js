// cTunes - Planet Nine Album Browser
// Album-focused music player interface

(function() {
    'use strict';

    // Use relative path for feeds endpoint
    const FEED_URL = '/canimus/feeds';

    // State
    let allFeeds = [];
    let albums = [];
    let allTracks = [];
    let currentAlbum = null;
    let currentTrackIndex = -1;
    let isPlaying = false;
    let currentView = 'grid'; // 'grid' or 'detail'

    // DOM elements
    const albumGrid = document.getElementById('albumGrid');
    const albumDetail = document.getElementById('albumDetail');
    const detailCover = document.getElementById('detailCover');
    const detailTitle = document.getElementById('detailTitle');
    const detailArtist = document.getElementById('detailArtist');
    const detailDescription = document.getElementById('detailDescription');
    const detailTracks = document.getElementById('detailTracks');
    const backBtn = document.getElementById('backBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');

    // Player elements
    const playerContainer = document.getElementById('playerContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    const playerPlayPauseBtn = document.getElementById('playerPlayPauseBtn');
    const playerPlayIcon = document.getElementById('playerPlayIcon');
    const playerPauseIcon = document.getElementById('playerPauseIcon');
    const playerPrevBtn = document.getElementById('playerPrevBtn');
    const playerNextBtn = document.getElementById('playerNextBtn');
    const playerProgressBar = document.getElementById('playerProgressBar');
    const playerProgressFill = document.getElementById('playerProgressFill');
    const playerCurrentTime = document.getElementById('playerCurrentTime');
    const playerTotalTime = document.getElementById('playerTotalTime');
    const playerTrackTitle = document.getElementById('playerTrackTitle');
    const playerTrackArtist = document.getElementById('playerTrackArtist');
    const playerAlbumArt = document.getElementById('playerAlbumArt');

    // Initialize
    async function init() {
        try {
            await loadFeeds();
            parseAlbums();
            renderAlbumGrid();
            setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize cTunes:', error);
            albumGrid.innerHTML = '<div class="loading">Failed to load music library</div>';
        }
    }

    // Load all feeds from server
    async function loadFeeds() {
        const response = await fetch(FEED_URL);
        const data = await response.json();
        allFeeds = data.feeds || [];
    }

    // Parse albums from all feeds
    function parseAlbums() {
        albums = [];
        allTracks = [];
        let globalTrackNumber = 1;

        allFeeds.forEach(feed => {
            if (feed.children) {
                parseChildren(feed.children, feed.name);
            }
        });

        console.log('Parsed albums:', albums.length);
        console.log('Total tracks:', allTracks.length);
    }

    function parseChildren(children, feedName, parentAlbumName = null, parentAlbumCover = null) {
        children.forEach(item => {
            if (item.type === 'album') {
                const albumName = item.name;
                const albumCover = item.images?.cover?.src || item.images?.[0]?.src || '';
                const albumDescription = stripHtml(item.description || '');

                // Find artist from first track in album
                let albumArtist = 'Various Artists';
                if (item.children) {
                    const firstTrack = item.children.find(child => child.type === 'track');
                    if (firstTrack) {
                        albumArtist = firstTrack.artist || firstTrack.Artist || albumArtist;
                    }
                }

                const album = {
                    name: albumName,
                    artist: albumArtist,
                    cover: albumCover,
                    description: albumDescription,
                    feedName: feedName,
                    tracks: [],
                    id: albums.length
                };

                albums.push(album);

                // Parse album tracks
                if (item.children) {
                    parseChildren(item.children, feedName, album, albumCover);
                }
            }

            if (item.type === 'track') {
                // Support multiple audio formats
                const audioSrc = item.media?.find(m =>
                    m.type === 'audio/mp3' ||
                    m.type === 'audio/m4a' ||
                    m.type === 'audio/mpeg'
                )?.src || item.url;

                if (audioSrc) {
                    const track = {
                        globalNumber: allTracks.length + 1,
                        title: item.name,
                        artist: item.artist || item.Artist || 'Unknown Artist',
                        album: parentAlbumName ? parentAlbumName.name : feedName,
                        albumId: parentAlbumName ? parentAlbumName.id : null,
                        duration: item.duration || item.Duration || 0,
                        src: audioSrc,
                        cover: item.images?.cover?.src || parentAlbumCover || '',
                        description: stripHtml(item.description || ''),
                        purchaseLink: item.links?.find(link => link.rel === 'purchase') || null
                    };

                    allTracks.push(track);

                    // Add to album's track list
                    if (parentAlbumName) {
                        track.number = parentAlbumName.tracks.length + 1;
                        parentAlbumName.tracks.push(track);
                    }
                }
            }

            // Recursively parse children
            if (item.children && item.type !== 'album') {
                parseChildren(item.children, feedName, parentAlbumName, parentAlbumCover);
            }
        });
    }

    // Render album grid
    function renderAlbumGrid() {
        albumGrid.innerHTML = '';

        if (albums.length === 0) {
            albumGrid.innerHTML = '<div class="loading">No albums found</div>';
            return;
        }

        albums.forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.className = 'album-card';
            albumCard.dataset.albumId = album.id;

            albumCard.innerHTML = `
                <img class="album-cover" src="${album.cover || ''}" alt="${escapeHtml(album.name)}"
                     onerror="this.style.display='none'">
                <div class="album-title">${escapeHtml(album.name)}</div>
                <div class="album-artist">${escapeHtml(album.artist)}</div>
                <div class="album-track-count">${album.tracks.length} track${album.tracks.length !== 1 ? 's' : ''}</div>
            `;

            albumCard.addEventListener('click', () => {
                showAlbumDetail(album);
            });

            albumGrid.appendChild(albumCard);
        });
    }

    // Show album detail view
    function showAlbumDetail(album) {
        currentAlbum = album;
        currentView = 'detail';

        // Update detail view
        detailCover.src = album.cover || '';
        detailCover.style.display = album.cover ? 'block' : 'none';
        detailTitle.textContent = album.name;
        detailArtist.textContent = album.artist;
        detailDescription.textContent = album.description;

        // Render tracks
        detailTracks.innerHTML = '';
        album.tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.trackIndex = index;
            trackItem.dataset.albumId = album.id;

            trackItem.innerHTML = `
                <div class="track-number">${track.number}</div>
                <div class="track-item-info">
                    <div class="track-item-title">${escapeHtml(track.title)}</div>
                    <div class="track-item-meta">${escapeHtml(track.artist)}</div>
                </div>
                <div class="track-duration">${formatTime(track.duration)}</div>
            `;

            trackItem.addEventListener('click', () => {
                playTrackFromAlbum(album, index);
            });

            detailTracks.appendChild(trackItem);
        });

        // Show detail view
        albumGrid.style.display = 'none';
        albumDetail.classList.add('visible');
    }

    // Hide album detail, show grid
    function showAlbumGrid() {
        currentView = 'grid';
        albumDetail.classList.remove('visible');
        albumGrid.style.display = 'grid';
    }

    // Play track from album
    function playTrackFromAlbum(album, trackIndex) {
        if (trackIndex < 0 || trackIndex >= album.tracks.length) return;

        const track = album.tracks[trackIndex];
        currentTrackIndex = allTracks.findIndex(t =>
            t.title === track.title &&
            t.album === track.album &&
            t.src === track.src
        );

        playTrack(track);

        // Update track highlighting in detail view
        document.querySelectorAll('.track-item').forEach((item, i) => {
            item.classList.toggle('playing', i === trackIndex);
        });
    }

    // Play track
    function playTrack(track) {
        // Update player UI
        playerTrackTitle.textContent = track.title;
        playerTrackArtist.textContent = track.artist;
        playerAlbumArt.src = track.cover || '';
        playerAlbumArt.style.display = track.cover ? 'block' : 'none';

        // Show player
        playerContainer.classList.add('visible');

        // Load and play audio
        audioPlayer.src = track.src;
        audioPlayer.play();
        isPlaying = true;
        updatePlayPauseButton();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Back button
        backBtn.addEventListener('click', showAlbumGrid);

        // View toggle
        gridViewBtn.addEventListener('click', () => {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            showAlbumGrid();
        });

        listViewBtn.addEventListener('click', () => {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            showAllTracksView();
        });

        // Player controls
        playerPlayPauseBtn.addEventListener('click', () => {
            if (currentTrackIndex === -1 && allTracks.length > 0) {
                playTrack(allTracks[0]);
                currentTrackIndex = 0;
            } else if (isPlaying) {
                audioPlayer.pause();
                isPlaying = false;
            } else {
                audioPlayer.play();
                isPlaying = true;
            }
            updatePlayPauseButton();
        });

        playerPrevBtn.addEventListener('click', () => {
            if (currentTrackIndex > 0) {
                currentTrackIndex--;
                playTrack(allTracks[currentTrackIndex]);
            }
        });

        playerNextBtn.addEventListener('click', () => {
            if (currentTrackIndex < allTracks.length - 1) {
                currentTrackIndex++;
                playTrack(allTracks[currentTrackIndex]);
            }
        });

        // Audio events
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', () => {
            playerTotalTime.textContent = formatTime(audioPlayer.duration);
        });
        audioPlayer.addEventListener('ended', () => {
            // Auto-play next track
            if (currentTrackIndex < allTracks.length - 1) {
                currentTrackIndex++;
                playTrack(allTracks[currentTrackIndex]);
            } else {
                isPlaying = false;
                updatePlayPauseButton();
            }
        });

        // Progress bar click
        playerProgressBar.addEventListener('click', (e) => {
            const rect = playerProgressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioPlayer.currentTime = audioPlayer.duration * percent;
        });
    }

    // Show all tracks view
    function showAllTracksView() {
        currentView = 'list';
        albumDetail.classList.remove('visible');
        albumGrid.style.display = 'none';

        // Create a temporary container for all tracks
        let allTracksContainer = document.getElementById('allTracksContainer');
        if (!allTracksContainer) {
            allTracksContainer = document.createElement('div');
            allTracksContainer.id = 'allTracksContainer';
            allTracksContainer.className = 'track-list';
            allTracksContainer.style.marginBottom = '100px';
            document.querySelector('.container').appendChild(allTracksContainer);
        }

        allTracksContainer.innerHTML = '';
        allTracksContainer.style.display = 'grid';

        allTracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.trackIndex = index;

            trackItem.innerHTML = `
                <div class="track-number">${track.globalNumber}</div>
                <div class="track-item-info">
                    <div class="track-item-title">${escapeHtml(track.title)}</div>
                    <div class="track-item-meta">${escapeHtml(track.artist)} • ${escapeHtml(track.album)}</div>
                </div>
                <div class="track-duration">${formatTime(track.duration)}</div>
            `;

            trackItem.addEventListener('click', () => {
                currentTrackIndex = index;
                playTrack(track);

                // Update highlighting
                document.querySelectorAll('#allTracksContainer .track-item').forEach((item, i) => {
                    item.classList.toggle('playing', i === index);
                });
            });

            allTracksContainer.appendChild(trackItem);
        });
    }

    // Update play/pause button
    function updatePlayPauseButton() {
        if (isPlaying) {
            playerPlayIcon.style.display = 'none';
            playerPauseIcon.style.display = 'block';
            playerPlayPauseBtn.title = 'Pause';
        } else {
            playerPlayIcon.style.display = 'block';
            playerPauseIcon.style.display = 'none';
            playerPlayPauseBtn.title = 'Play';
        }
    }

    // Update progress bar
    function updateProgress() {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            playerProgressFill.style.width = percent + '%';
            playerCurrentTime.textContent = formatTime(audioPlayer.currentTime);
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
