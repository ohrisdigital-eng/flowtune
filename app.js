// ==========================================
// FLOWTUNE - MAIN APP
// Music Player + IndexedDB + Mood Engine
// YouTube Online Search + Player + Queue
// ==========================================

"use strict";


// ==========================================
// GLOBAL STATE
// ==========================================

let currentSongIndex = -1;
let allSongs = [];

let audioPlayer = null;
let playButton = null;
let playerTitle = null;
let playerArtist = null;
let playerImage = null;

// YouTube state
let youtubePlayer = null;
let youtubePlayerReady = false;

let currentOnlineSong = null;
let onlineQueue = [];
let onlineQueueIndex = -1;


// ==========================================
// DATABASE
// ==========================================

const DB_NAME = "FlowTuneDB";
const DB_VERSION = 1;
const STORE_NAME = "songs";


function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

        request.onupgradeneeded = function (event) {

            const db =
                event.target.result;

            if (
                !db.objectStoreNames.contains(
                    STORE_NAME
                )
            ) {

                db.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );

            }

        };

        request.onsuccess = function () {

            resolve(request.result);

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// ==========================================
// SAVE SONG TO DATABASE
// ==========================================

async function saveSongToDatabase(song) {

    const db =
        await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.put(song);

        request.onsuccess = function () {

            resolve();

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// ==========================================
// GET STORED SONGS
// ==========================================

async function getStoredSongs() {

    const db =
        await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.getAll();

        request.onsuccess = function () {

            resolve(
                request.result || []
            );

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// ==========================================
// LOAD SONGS
// ==========================================

async function loadSongs() {

    try {

        allSongs =
            Array.isArray(window.songs)
                ? [...window.songs]
                : [];


        const storedSongs =
            await getStoredSongs();


        storedSongs.forEach(song => {

            if (song.audioBlob) {

                song.audio =
                    URL.createObjectURL(
                        song.audioBlob
                    );

            }


            if (song.coverBlob) {

                song.image =
                    URL.createObjectURL(
                        song.coverBlob
                    );

            }


            allSongs.push(song);

        });


        console.log(
            "FlowTune songs:",
            allSongs
        );


        renderSongs();

    } catch (error) {

        console.error(
            "Could not load songs:",
            error
        );

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ==========================================
// RENDER LOCAL SONGS
// ==========================================

function renderSongs() {

    const grid =
        document.getElementById(
            "songGrid"
        );

    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    if (allSongs.length === 0) {

        grid.innerHTML = `
            <div class="no-results">
                <h2>No songs yet</h2>
                <p>
                    Use Add Music to upload
                    your first song.
                </p>
            </div>
        `;

        return;

    }


    allSongs.forEach(
        function (song, index) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "song-card";


            card.innerHTML = `
                <img
                    src="${escapeHTML(
                        song.image ||
                        "https://picsum.photos/300"
                    )}"
                    alt="${escapeHTML(
                        song.title
                    )}"
                >

                <h3>
                    ${escapeHTML(
                        song.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        song.artist
                    )}
                </p>

                <button
                    type="button"
                    onclick="playSong(${index})"
                >
                    Play
                </button>
            `;


            grid.appendChild(card);

        }
    );

}


// ==========================================
// LOCAL SONG PLAYBACK
// ==========================================

function playSong(index) {

    const song =
        allSongs[index];

    if (
        !song ||
        !audioPlayer
    ) {
        return;
    }


    // Switch from online to local
    currentOnlineSong = null;

    onlineQueue = [];
    onlineQueueIndex = -1;

    window.flowTuneCurrentOnlineSong =
        null;


    currentSongIndex =
        index;


    audioPlayer.src =
        song.audio;


    if (playerTitle) {

        playerTitle.textContent =
            song.title;

    }


    if (playerArtist) {

        playerArtist.textContent =
            song.artist;

    }


    if (playerImage) {

        playerImage.src =
            song.image ||
            "https://picsum.photos/300";

    }


    // Hide YouTube player
    const youtubeContainer =
        document.getElementById(
            "youtubePlayerContainer"
        );

    if (youtubeContainer) {

        youtubeContainer.style.display =
            "none";

    }


    audioPlayer.play()
        .then(function () {

            updatePlayButton();

        })
        .catch(function (error) {

            console.error(
                "Audio playback error:",
                error
            );

        });

}


// ==========================================
// PLAY FIRST LOCAL SONG
// ==========================================

function playFirstSong() {

    if (allSongs.length > 0) {

        playSong(0);

    }

}


// ==========================================
// UPDATE PLAY BUTTON
// ==========================================

function showPlayIcon() {

    const button =
        document.getElementById(
            "playButton"
        );

    if (!button) {
        return;
    }


    button.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M8 5 L19 12 L8 19 Z"
            ></path>
        </svg>
    `;


    button.setAttribute(
        "title",
        "Play"
    );

    button.setAttribute(
        "aria-label",
        "Play"
    );

}


function showPauseIcon() {

    const button =
        document.getElementById(
            "playButton"
        );

    if (!button) {
        return;
    }


    button.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <rect
                x="6"
                y="5"
                width="4"
                height="14"
                rx="1"
            ></rect>

            <rect
                x="14"
                y="5"
                width="4"
                height="14"
                rx="1"
            ></rect>
        </svg>
    `;


    button.setAttribute(
        "title",
        "Pause"
    );

    button.setAttribute(
        "aria-label",
        "Pause"
    );

}


function updatePlayButton() {

    if (
        currentOnlineSong &&
        youtubePlayer
    ) {

        updateYouTubePlayButton();

        return;

    }


    if (!audioPlayer) {
        return;
    }


    if (audioPlayer.paused) {

        showPlayIcon();

    } else {

        showPauseIcon();

    }

}


// ==========================================
// GET YOUTUBE API BASE
// ==========================================

function getYouTubeAPIBase() {

    const host =
        window.location.hostname;


    // GitHub Codespaces
    if (
        host.includes(
            ".app.github.dev"
        )
    ) {

        const apiHost =
            host.replace(
                /-\d+\.app\.github\.dev$/,
                "-3000.app.github.dev"
            );

        return (
            window.location.protocol +
            "//" +
            apiHost
        );

    }


    // Local computer
    if (
        host === "localhost" ||
        host === "127.0.0.1"
    ) {

        return "http://localhost:3000";

    }


    // Same-origin production server
    return "";

}


// ==========================================
// YOUTUBE IFRAME API READY
// ==========================================

window.onYouTubeIframeAPIReady =
    function () {

        console.log(
            "FlowTune: YouTube IFrame API ready."
        );


        createYouTubePlayer();

    };


// ==========================================
// CREATE YOUTUBE PLAYER
// ==========================================

function createYouTubePlayer() {

    if (
        typeof window.YT === "undefined" ||
        !window.YT.Player
    ) {

        console.log(
            "FlowTune: Waiting for YouTube API..."
        );

        return;

    }


    if (youtubePlayer) {

        return;

    }


    const container =
        document.getElementById(
            "youtubePlayer"
        );

    if (!container) {

        console.error(
            "FlowTune: #youtubePlayer not found."
        );

        return;

    }


    youtubePlayer =
        new YT.Player(
            "youtubePlayer",
            {

                width: "100%",
                height: "100%",

                videoId: "",

                playerVars: {

                    autoplay: 0,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1

                },

                events: {

                    onReady:
                        function () {

                            youtubePlayerReady =
                                true;

                            console.log(
                                "FlowTune: YouTube Player is ready."
                            );

                        },


                    onStateChange:
                        function (event) {

                            handleYouTubeState(
                                event
                            );

                        },


                    onError:
                        function (event) {

                            console.error(
                                "FlowTune YouTube Player Error:",
                                event.data
                            );

                        }

                }

            }
        );

}


// ==========================================
// HANDLE YOUTUBE STATE
// ==========================================

function handleYouTubeState(event) {

    if (
        typeof window.YT === "undefined"
    ) {
        return;
    }


    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        showPauseIcon();

    }


    else if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        showPlayIcon();

    }


    else if (
        event.data ===
        YT.PlayerState.BUFFERING
    ) {

        showPauseIcon();

    }


    else if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        showPlayIcon();


        // Automatically play next online result
        if (
            currentOnlineSong &&
            onlineQueue.length > 0
        ) {

            playNextOnlineSong();

        }

    }

}


// ==========================================
// PLAY YOUTUBE SONG
// ==========================================

window.playYouTubeSong =
    function (
        videoId,
        title,
        artist,
        thumbnail,
        queue,
        queueIndex
    ) {

        window.flowTuneCurrentYouTubeVideoId =videoId;

        if (!videoId) {

            console.error(
                "FlowTune: YouTube video ID missing."
            );

            return;

        }


        // Save online queue
        if (
            Array.isArray(queue)
        ) {

            onlineQueue =
                queue;

        }


        if (
            typeof queueIndex ===
            "number"
        ) {

            onlineQueueIndex =
                queueIndex;

        }


        // Current online song
        currentOnlineSong = {

            videoId:
                videoId,

            title:
                title ||
                "Unknown Song",

            artist:
                artist ||
                "Unknown Artist",

            thumbnail:
                thumbnail ||
                "https://picsum.photos/300"

        };


        window.flowTuneCurrentOnlineSong =
            currentOnlineSong;


        // Update player information
        if (playerTitle) {

            playerTitle.textContent =
                currentOnlineSong.title;

        }


        if (playerArtist) {

            playerArtist.textContent =
                currentOnlineSong.artist;

        }


        if (playerImage) {

            playerImage.src =
                currentOnlineSong.thumbnail;

        }


        // Show YouTube player
        const youtubeContainer =
            document.getElementById(
                "youtubePlayerContainer"
            );

        if (youtubeContainer) {

            youtubeContainer.style.display =
                "block";

        }


        // Hide local audio
        if (audioPlayer) {

            audioPlayer.pause();

            audioPlayer.removeAttribute(
                "src"
            );

            audioPlayer.load();

        }


        // Create player if not ready
        if (
            !youtubePlayer ||
            !youtubePlayerReady
        ) {

            createYouTubePlayer();


            // Try again shortly
            setTimeout(
                function () {

                    if (
                        youtubePlayer &&
                        youtubePlayerReady
                    ) {

                        youtubePlayer.loadVideoById(
                            videoId
                        );

                    }

                },
                500
            );


            return;

        }


        console.log(
            "FlowTune: Playing online:",
            title
        );


        youtubePlayer.loadVideoById(
            videoId
        );

    };


// ==========================================
// ONLINE SEARCH
// ==========================================

window.searchOnlineSongs =
    async function () {

        const input =
            document.getElementById(
                "searchInput"
            );

        const results =
            document.getElementById(
                "searchResults"
            );

        const status =
            document.getElementById(
                "onlineSearchStatus"
            );


        if (
            !input ||
            !results
        ) {

            console.error(
                "FlowTune: Search elements not found."
            );

            return;

        }


        const query =
            input.value.trim();


        if (!query) {

            results.innerHTML = "";

            if (status) {

                status.textContent =
                    "Search for any song, artist or album.";

            }

            return;

        }


        if (status) {

            status.textContent =
                "Searching for " +
                query +
                "...";

        }


        results.innerHTML = "";


        try {

            const API_BASE =
                getYouTubeAPIBase();


            const response =
                await fetch(
                    API_BASE +
                    "/api/youtube-search?q=" +
                    encodeURIComponent(
                        query
                    )
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "YouTube search failed."
                );

            }


            const items =
                Array.isArray(
                    data.items
                )
                    ? data.items
                    : [];


            // ==========================================
            // CREATE ONLINE QUEUE
            // ==========================================

            onlineQueue =
                items
                    .filter(
                        function (item) {

                            return (
                                item.id &&
                                item.id.videoId
                            );

                        }
                    )
                    .map(
                        function (item) {

                            const snippet =
                                item.snippet ||
                                {};

                            const thumbnail =
                                snippet.thumbnails &&
                                (
                                    snippet.thumbnails.medium ||
                                    snippet.thumbnails.high ||
                                    snippet.thumbnails.default
                                );


                            return {

                                videoId:
                                    item.id.videoId,

                                title:
                                    snippet.title ||
                                    "Unknown Song",

                                artist:
                                    snippet.channelTitle ||
                                    "Unknown Artist",

                                thumbnail:
                                    thumbnail
                                        ? thumbnail.url
                                        : "https://picsum.photos/300"

                            };

                        }
                    );


            onlineQueueIndex = -1;


            if (
                onlineQueue.length === 0
            ) {

                if (status) {

                    status.textContent =
                        "No results found.";

                }

                return;

            }


            if (status) {

                status.textContent =
                    onlineQueue.length +
                    " results found for " +
                    query;

            }


            // ==========================================
            // DISPLAY RESULTS
            // ==========================================

            onlineQueue.forEach(
                function (
                    song,
                    index
                ) {

                    const result =
                        document.createElement(
                            "div"
                        );

                    result.className =
                        "online-song-result";


                    result.innerHTML = `
                        <img
                            src="${escapeHTML(
                                song.thumbnail
                            )}"
                            alt="${escapeHTML(
                                song.title
                            )}"
                        >

                        <div class="online-song-info">

                            <div class="online-song-title">
                                ${escapeHTML(
                                    song.title
                                )}
                            </div>

                            <div class="online-song-artist">
                                ${escapeHTML(
                                    song.artist
                                )}
                            </div>

                        </div>

                        <button
                            class="online-play-button"
                            type="button"
                            aria-label="Play ${escapeHTML(
                                song.title
                            )}"
                        >
                            ▶
                        </button>
                    `;


                    const button =
                        result.querySelector(
                            ".online-play-button"
                        );


                    button.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();
                            event.stopPropagation();


                            // Save queue position
                            onlineQueueIndex =
                                index;


                            // Play selected song
                            window.playYouTubeSong(
                                song.videoId,
                                song.title,
                                song.artist,
                                song.thumbnail,
                                onlineQueue,
                                index
                            );

                        }
                    );


                    results.appendChild(
                        result
                    );

                }
            );


        } catch (error) {

            console.error(
                "FlowTune online search error:",
                error
            );


            if (status) {

                status.textContent =
                    "Online search failed.";

            }


            results.innerHTML = `
                <div class="no-results">

                    <h3>
                        Online search failed
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>
            `;

        }

    };


// ==========================================
// PLAY / PAUSE
// ==========================================

window.togglePlay =
    function () {

        // ONLINE SONG
        if (
            currentOnlineSong
        ) {

            if (
                !youtubePlayer ||
                !youtubePlayerReady
            ) {

                console.log(
                    "FlowTune: YouTube player not ready."
                );

                return;

            }


            let state;

            try {

                state =
                    youtubePlayer.getPlayerState();

            } catch (error) {

                console.error(
                    "FlowTune: Could not get YouTube state.",
                    error
                );

                return;

            }


            if (
                state ===
                YT.PlayerState.PLAYING
            ) {

                youtubePlayer.pauseVideo();

                showPlayIcon();

            } else {

                youtubePlayer.playVideo();

                showPauseIcon();

            }


            return;

        }


        // LOCAL SONG
        if (!audioPlayer) {
            return;
        }


        if (!audioPlayer.src) {

            playFirstSong();

            return;

        }


        if (
            audioPlayer.paused
        ) {

            audioPlayer.play()
                .catch(
                    function (error) {

                        console.error(
                            "FlowTune audio error:",
                            error
                        );

                    }
                );

        } else {

            audioPlayer.pause();

        }

    };


// ==========================================
// NEXT ONLINE SONG
// ==========================================

function playNextOnlineSong() {

    if (
        onlineQueue.length === 0
    ) {

        return;

    }


    let nextIndex =
        onlineQueueIndex + 1;


    if (
        nextIndex >=
        onlineQueue.length
    ) {

        nextIndex = 0;

    }


    const song =
        onlineQueue[nextIndex];


    if (!song) {
        return;
    }


    onlineQueueIndex =
        nextIndex;


    window.playYouTubeSong(
        song.videoId,
        song.title,
        song.artist,
        song.thumbnail,
        onlineQueue,
        nextIndex
    );

}


// ==========================================
// NEXT SONG
// ==========================================

window.nextSong =
    function () {

        // Online queue
        if (
            currentOnlineSong &&
            onlineQueue.length > 0
        ) {

            playNextOnlineSong();

            return;

        }


        // Local songs
        if (
            allSongs.length === 0
        ) {

            return;

        }


        let next =
            currentSongIndex + 1;


        if (
            next >=
            allSongs.length
        ) {

            next = 0;

        }


        playSong(next);

    };


// ==========================================
// PREVIOUS ONLINE SONG
// ==========================================

function playPreviousOnlineSong() {

    if (
        onlineQueue.length === 0
    ) {

        return;

    }


    let previousIndex =
        onlineQueueIndex - 1;


    if (
        previousIndex < 0
    ) {

        previousIndex =
            onlineQueue.length - 1;

    }


    const song =
        onlineQueue[
            previousIndex
        ];


    if (!song) {
        return;
    }


    onlineQueueIndex =
        previousIndex;


    window.playYouTubeSong(
        song.videoId,
        song.title,
        song.artist,
        song.thumbnail,
        onlineQueue,
        previousIndex
    );

}


// ==========================================
// PREVIOUS SONG
// ==========================================

window.previousSong =
    function () {

        // Online queue
        if (
            currentOnlineSong &&
            onlineQueue.length > 0
        ) {

            playPreviousOnlineSong();

            return;

        }


        // Local songs
        if (
            allSongs.length === 0
        ) {

            return;

        }


        let previous =
            currentSongIndex - 1;


        if (
            previous < 0
        ) {

            previous =
                allSongs.length - 1;

        }


        playSong(previous);

    };


// ==========================================
// UPDATE YOUTUBE PLAY ICON
// ==========================================

function updateYouTubePlayButton() {

    if (
        !youtubePlayer ||
        !youtubePlayerReady
    ) {

        return;

    }


    try {

        const state =
            youtubePlayer.getPlayerState();


        if (
            state ===
            YT.PlayerState.PLAYING ||
            state ===
            YT.PlayerState.BUFFERING
        ) {

            showPauseIcon();

        } else {

            showPlayIcon();

        }

    } catch (error) {

        // Player may still be initializing

    }

}


// ==========================================
// SEARCH ENTER KEY
// ==========================================

function handleSearchKey(event) {

    if (
        event.key === "Enter"
    ) {

        event.preventDefault();

        window.searchOnlineSongs();

    }

}


// Make available to HTML
window.handleSearchKey =
    handleSearchKey;


// ==========================================
// LOCAL SEARCH
// ==========================================

function searchSongs() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) {
        return;
    }


    const query =
        input.value
            .toLowerCase()
            .trim();


    if (!query) {

        showPage("search");


        const status =
            document.getElementById(
                "onlineSearchStatus"
            );


        const results =
            document.getElementById(
                "searchResults"
            );


        if (status) {

            status.textContent =
                "Search for any song, artist or album.";

        }


        if (results) {

            results.innerHTML = "";

        }


        return;

    }


    showPage("search");


    window.searchOnlineSongs();

}


// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(
            function (page) {

                page.classList.add(
                    "hidden"
                );

            }
        );


    const selectedPage =
        document.getElementById(
            pageName + "Page"
        );


    if (selectedPage) {

        selectedPage.classList.remove(
            "hidden"
        );

    }


    document
        .querySelectorAll(
            ".sidebar nav button"
        )
        .forEach(
            function (button) {

                button.classList.remove(
                    "active"
                );

            }
        );


    const pageButtonMap = {

        home: 0,
        search: 1,
        library: 2,
        addMusic: 3

    };


    const buttons =
        document.querySelectorAll(
            ".sidebar nav button"
        );


    const buttonIndex =
        pageButtonMap[pageName];


    if (
        buttonIndex !== undefined &&
        buttons[buttonIndex]
    ) {

        buttons[buttonIndex]
            .classList.add(
                "active"
            );

    }

}


// ==========================================
// MOOD ENGINE
// ==========================================

function selectMood(mood) {

    const moodSongs =
        allSongs.filter(
            function (song) {

                return (
                    song.mood &&
                    song.mood.toLowerCase() ===
                    mood.toLowerCase()
                );

            }
        );


    const selectedMood =
        document.getElementById(
            "selectedMood"
        );


    if (!selectedMood) {
        return;
    }


    if (
        moodSongs.length === 0
    ) {

        selectedMood.textContent =
            "No songs available for " +
            mood +
            " yet.";

        return;

    }


    selectedMood.textContent =
        mood +
        " mood selected - " +
        moodSongs.length +
        " song" +
        (
            moodSongs.length > 1
                ? "s"
                : ""
        ) +
        " found";


    displayMoodSongs(
        moodSongs
    );

}


// Make mood function available
window.selectMood =
    selectMood;


// ==========================================
// DISPLAY MOOD SONGS
// ==========================================

function displayMoodSongs(
    moodSongs
) {

    const songGrid =
        document.getElementById(
            "songGrid"
        );


    if (!songGrid) {
        return;
    }


    songGrid.innerHTML = "";


    moodSongs.forEach(
        function (song) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "song-card";


            card.innerHTML = `
                <img
                    src="${escapeHTML(
                        song.image ||
                        "https://picsum.photos/300"
                    )}"
                    alt="${escapeHTML(
                        song.title
                    )}"
                >

                <h3>
                    ${escapeHTML(
                        song.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        song.artist
                    )}
                </p>

                <button
                    type="button"
                >
                    Play
                </button>
            `;


            const button =
                card.querySelector(
                    "button"
                );


            button.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();


                    const index =
                        allSongs.indexOf(
                            song
                        );


                    if (
                        index !== -1
                    ) {

                        playSong(index);

                    }

                }
            );


            songGrid.appendChild(
                card
            );

        }
    );

}


// ==========================================
// ADD MUSIC
// ==========================================

function setupAddMusic() {

    const addMusicForm =
        document.getElementById(
            "addMusicForm"
        );


    if (!addMusicForm) {

        console.log(
            "Add Music form not found."
        );

        return;

    }


    addMusicForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const musicInput =
                document.getElementById(
                    "musicFile"
                );


            const coverInput =
                document.getElementById(
                    "coverFile"
                );


            const titleInput =
                document.getElementById(
                    "songTitle"
                );


            const artistInput =
                document.getElementById(
                    "songArtist"
                );


            const albumInput =
                document.getElementById(
                    "songAlbum"
                );


            const genreInput =
                document.getElementById(
                    "songGenre"
                );


            const musicFile =
                musicInput
                    ? musicInput.files[0]
                    : null;


            const coverFile =
                coverInput
                    ? coverInput.files[0]
                    : null;


            const title =
                titleInput
                    ? titleInput.value.trim()
                    : "";


            const artist =
                artistInput
                    ? artistInput.value.trim()
                    : "";


            const album =
                albumInput
                    ? albumInput.value.trim()
                    : "";


            const genre =
                genreInput
                    ? genreInput.value
                    : "Other";


            if (!musicFile) {

                alert(
                    "Please choose a music file."
                );

                return;

            }


            if (
                !title ||
                !artist
            ) {

                alert(
                    "Please enter song title and artist."
                );

                return;

            }


            try {

                const newSong = {

                    id:
                        "uploaded_" +
                        Date.now(),

                    title:
                        title,

                    artist:
                        artist,

                    album:
                        album ||
                        "Unknown Album",

                    genre:
                        genre ||
                        "Other",

                    mood:
                        "Other",

                    audioBlob:
                        musicFile,

                    coverBlob:
                        coverFile ||
                        null,

                    audio:
                        URL.createObjectURL(
                            musicFile
                        ),

                    image:
                        coverFile
                            ? URL.createObjectURL(
                                coverFile
                            )
                            : "https://picsum.photos/300"

                };


                await saveSongToDatabase(
                    newSong
                );


                allSongs.push(
                    newSong
                );


                renderSongs();


                const message =
                    document.getElementById(
                        "addMusicMessage"
                    );


                if (message) {

                    message.textContent =
                        "Song added successfully.";

                    message.className =
                        "add-music-message success";

                } else {

                    alert(
                        "Song added successfully."
                    );

                }


                addMusicForm.reset();


            } catch (error) {

                console.error(
                    "Could not save song:",
                    error
                );


                alert(
                    "Could not save the song."
                );

            }

        }
    );

}


// ==========================================
// VOLUME
// ==========================================

function changeVolume() {

    if (!audioPlayer) {
        return;
    }


    const slider =
        document.getElementById(
            "volumeControl"
        );


    if (!slider) {
        return;
    }


    const value =
        Number(slider.value);


    audioPlayer.volume =
        value;


    const percent =
        value * 100;


    slider.style.background = `
        linear-gradient(
            to right,
            #22e6a8 0%,
            #22e6a8 ${percent}%,
            rgba(255,255,255,0.35) ${percent}%,
            rgba(255,255,255,0.35) 100%
        )
    `;

}


// ==========================================
// DOM READY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "FlowTune: Initializing..."
        );


        audioPlayer =
            document.getElementById(
                "audioPlayer"
            );


        playButton =
            document.getElementById(
                "playButton"
            );


        playerTitle =
            document.getElementById(
                "playerTitle"
            );


        playerArtist =
            document.getElementById(
                "playerArtist"
            );


        playerImage =
            document.getElementById(
                "playerImage"
            );


        // ==========================================
        // LOCAL AUDIO EVENTS
        // ==========================================

        if (audioPlayer) {

            audioPlayer.addEventListener(
                "play",
                function () {

                    if (
                        !currentOnlineSong
                    ) {

                        showPauseIcon();

                    }

                }
            );


            audioPlayer.addEventListener(
                "pause",
                function () {

                    if (
                        !currentOnlineSong
                    ) {

                        showPlayIcon();

                    }

                }
            );


            audioPlayer.addEventListener(
                "ended",
                function () {

                    if (
                        !currentOnlineSong
                    ) {

                        window.nextSong();

                    }

                }
            );

        }


        // ==========================================
        // SETUP
        // ==========================================

        setupAddMusic();

        await loadSongs();

        changeVolume();


        // ==========================================
        // YOUTUBE PLAYER
        // ==========================================

        createYouTubePlayer();


        // ==========================================
        // SEARCH ENTER
        // ==========================================

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        window.searchOnlineSongs();

                    }

                }
            );

        }


        console.log(
            "FlowTune is ready."
        );

    }
);


// ==========================================
// WAIT FOR YOUTUBE API
// ==========================================

(function waitForYouTube() {

    if (
        typeof window.YT !== "undefined" &&
        window.YT.Player
    ) {

        createYouTubePlayer();

        return;

    }


    setTimeout(
        waitForYouTube,
        500
    );

})();

// ==========================================
// FLOWTUNE VOLUME CONTROL - FINAL FIX
// ==========================================

window.changeVolume = function () {
    const slider = document.getElementById("volumeControl");

    if (!slider) {
        console.warn("FlowTune: volumeControl not found.");
        return;
    }

    const volume = parseFloat(slider.value);

    console.log("Changing volume to:", volume);

    // ------------------------------------------
    // LOCAL AUDIO
    // ------------------------------------------
    const localAudio = document.getElementById("audioPlayer");

    if (localAudio) {
        localAudio.volume = volume;
    }

    // ------------------------------------------
    // YOUTUBE AUDIO
    // ------------------------------------------
    const yt =
        window.youtubePlayer ||
        window.flowTuneYouTubePlayer;

    if (yt && typeof yt.setVolume === "function") {
        yt.setVolume(Math.round(volume * 100));

        console.log(
            "YouTube volume:",
            Math.round(volume * 100) + "%"
        );
    }
};


// ==========================================
// REAL-TIME VOLUME CONTROL
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const slider = document.getElementById("volumeControl");

    if (!slider) {
        console.warn("FlowTune: volume slider not found.");
        return;
    }

    const updateVolume = function () {

        const volume = parseFloat(slider.value);

        // Local audio
        const localAudio =
            document.getElementById("audioPlayer");

        if (localAudio) {
            localAudio.volume = volume;
        }

        // YouTube
        const yt =
            window.youtubePlayer ||
            window.flowTuneYouTubePlayer;

        if (
            yt &&
            typeof yt.setVolume === "function"
        ) {
            yt.setVolume(Math.round(volume * 100));
        }
    };

    // Works while dragging
    slider.addEventListener("input", updateVolume);

    // Also works when changed normally
    slider.addEventListener("change", updateVolume);

    // Initial volume
    updateVolume();

});

// ==========================================
// FLOWTUNE SMART PLAYLISTS - STEP 1
// ==========================================

(function () {

    const PLAYLIST_DB_NAME = "FlowTunePlaylistsDB";
    const PLAYLIST_DB_VERSION = 1;
    const PLAYLIST_STORE = "playlists";

    let playlistDB = null;


    // ==========================================
    // OPEN PLAYLIST DATABASE
    // ==========================================

    function openPlaylistDatabase() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(
                PLAYLIST_DB_NAME,
                PLAYLIST_DB_VERSION
            );

            request.onupgradeneeded = function (event) {

                const db = event.target.result;

                if (!db.objectStoreNames.contains(PLAYLIST_STORE)) {

                    db.createObjectStore(
                        PLAYLIST_STORE,
                        {
                            keyPath: "id"
                        }
                    );

                }

            };


            request.onsuccess = function (event) {

                playlistDB = event.target.result;

                resolve(playlistDB);

            };


            request.onerror = function () {

                reject(request.error);

            };

        });

    }


    // ==========================================
    // GET ALL PLAYLISTS
    // ==========================================

    function getPlaylists() {

        return new Promise((resolve, reject) => {

            if (!playlistDB) {
                reject("Playlist database is not ready.");
                return;
            }

            const transaction =
                playlistDB.transaction(
                    PLAYLIST_STORE,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    PLAYLIST_STORE
                );

            const request = store.getAll();


            request.onsuccess = function () {

                resolve(request.result || []);

            };


            request.onerror = function () {

                reject(request.error);

            };

        });

    }


    // ==========================================
    // SAVE PLAYLIST
    // ==========================================

    function savePlaylist(playlist) {

        return new Promise((resolve, reject) => {

            const transaction =
                playlistDB.transaction(
                    PLAYLIST_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    PLAYLIST_STORE
                );

            const request =
                store.put(playlist);


            request.onsuccess = function () {

                resolve();

            };


            request.onerror = function () {

                reject(request.error);

            };

        });

    }


    // ==========================================
    // DELETE PLAYLIST
    // ==========================================

    function deletePlaylistFromDatabase(id) {

        return new Promise((resolve, reject) => {

            const transaction =
                playlistDB.transaction(
                    PLAYLIST_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    PLAYLIST_STORE
                );

            const request =
                store.delete(id);


            request.onsuccess = function () {

                resolve();

            };


            request.onerror = function () {

                reject(request.error);

            };

        });

    }


    // ==========================================
    // OPEN CREATE PLAYLIST MODAL
    // ==========================================

    window.openCreatePlaylist = function () {

        const modal =
            document.getElementById(
                "playlistModal"
            );

        const input =
            document.getElementById(
                "playlistNameInput"
            );

        if (!modal) return;

        modal.classList.add("active");

        if (input) {

            input.value = "";

            setTimeout(() => {

                input.focus();

            }, 100);

        }

    };


    // ==========================================
    // CLOSE CREATE PLAYLIST MODAL
    // ==========================================

    window.closeCreatePlaylist = function () {

        const modal =
            document.getElementById(
                "playlistModal"
            );

        if (!modal) return;

        modal.classList.remove("active");

    };


    // ==========================================
    // CREATE PLAYLIST
    // ==========================================

    window.createPlaylist = async function () {

        const input =
            document.getElementById(
                "playlistNameInput"
            );

        if (!input) return;

        const name =
            input.value.trim();


        if (!name) {

            alert("Please enter a playlist name.");

            input.focus();

            return;

        }


        try {

            if (!playlistDB) {

                await openPlaylistDatabase();

            }


            const playlist = {

                id:
                    "playlist_" +
                    Date.now(),

                name: name,

                songs: [],

                createdAt:
                    new Date().toISOString()

            };


            await savePlaylist(playlist);


            closeCreatePlaylist();

            await renderPlaylists();


            console.log(
                "FlowTune playlist created:",
                playlist.name
            );


        } catch (error) {

            console.error(
                "Failed to create playlist:",
                error
            );

            alert(
                "Could not create playlist."
            );

        }

    };


    // ==========================================
    // RENDER PLAYLISTS
    // ==========================================

    async function renderPlaylists() {

        const grid =
            document.getElementById(
                "playlistGrid"
            );

        if (!grid) return;


        try {

            const playlists =
                await getPlaylists();


            grid.innerHTML = "";


            if (playlists.length === 0) {

                grid.innerHTML = `
                    <div style="
                        grid-column: 1 / -1;
                        text-align: center;
                        padding: 40px 20px;
                        color: #8e94b5;
                    ">
                        <div style="
                            font-size: 45px;
                            margin-bottom: 12px;
                        ">
                            🎵
                        </div>

                        <strong style="
                            display: block;
                            color: white;
                            font-size: 17px;
                            margin-bottom: 6px;
                        ">
                            No playlists yet
                        </strong>

                        <span>
                            Create your first playlist.
                        </span>
                    </div>
                `;

                return;

            }


            playlists
                .sort((a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                )
                .forEach(playlist => {

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "playlist-card";


                    card.innerHTML = `

                        <button
                            class="playlist-delete-button"
                            title="Delete playlist"
                        >
                            ×
                        </button>

                        <div class="playlist-cover">
                            🎵
                        </div>

                        <h3>
                            ${escapePlaylistHTML(
                                playlist.name
                            )}
                        </h3>

                        <p>
                            ${playlist.songs.length}
                            ${playlist.songs.length === 1
                                ? "song"
                                : "songs"}
                        </p>

                    `;


                    const deleteButton =
                        card.querySelector(
                            ".playlist-delete-button"
                        );


                    deleteButton.addEventListener(
                        "click",
                        async function (event) {

                            event.stopPropagation();

                            const confirmed =
                                confirm(
                                    `Delete "${playlist.name}"?`
                                );

                            if (!confirmed) {
                                return;
                            }


                            await deletePlaylistFromDatabase(
                                playlist.id
                            );

                            await renderPlaylists();

                        }
                    );


                    card.addEventListener(
                        "click",
                        function () {

                            console.log(
                                "Playlist selected:",
                                playlist.name
                            );

                            alert(
                                `"${playlist.name}" is ready. Song adding will be added in the next playlist upgrade.`
                            );

                        }
                    );


                    grid.appendChild(card);

                });


        } catch (error) {

            console.error(
                "Failed to render playlists:",
                error
            );

        }

    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapePlaylistHTML(text) {

        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ==========================================
    // INITIALIZE PLAYLIST SYSTEM
    // ==========================================

    async function initializePlaylists() {

        try {

            await openPlaylistDatabase();

            await renderPlaylists();

            console.log(
                "FlowTune Smart Playlists ready"
            );

        } catch (error) {

            console.error(
                "Playlist system failed:",
                error
            );

        }

    }


    // Wait until page is ready
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializePlaylists
        );

    } else {

        initializePlaylists();

    }

})();

// ==========================================
// FLOWTUNE - ADD CURRENT SONG TO PLAYLIST
// STEP 2
// ==========================================

(function () {

    const DB_NAME = "FlowTunePlaylistsDB";
    const DB_VERSION = 1;
    const STORE_NAME = "playlists";

    let playlistDatabase = null;
    let selectedSongForPlaylist = null;


    // ==========================================
    // OPEN PLAYLIST DATABASE
    // ==========================================

    function openPlaylistDB() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            request.onsuccess = function (event) {

                playlistDatabase =
                    event.target.result;

                resolve(playlistDatabase);
            };

            request.onerror = function () {

                reject(request.error);
            };

        });
    }


    // ==========================================
    // GET ALL PLAYLISTS
    // ==========================================

    function getAllPlaylists() {

        return new Promise((resolve, reject) => {

            if (!playlistDatabase) {

                reject(
                    new Error(
                        "Playlist database not ready."
                    )
                );

                return;
            }

            const transaction =
                playlistDatabase.transaction(
                    STORE_NAME,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            const request =
                store.getAll();

            request.onsuccess = function () {

                resolve(
                    request.result || []
                );
            };

            request.onerror = function () {

                reject(request.error);
            };

        });
    }


    // ==========================================
    // UPDATE PLAYLIST
    // ==========================================

    function updatePlaylist(playlist) {

        return new Promise((resolve, reject) => {

            const transaction =
                playlistDatabase.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            const request =
                store.put(playlist);

            request.onsuccess = function () {

                resolve();
            };

            request.onerror = function () {

                reject(request.error);
            };

        });
    }


    // ==========================================
    // OPEN "ADD TO PLAYLIST" WINDOW
    // ==========================================

    window.openAddToPlaylist = async function () {

        const titleElement =
            document.getElementById(
                "playerTitle"
            );

        if (!titleElement) {
            return;
        }


        const title =
            titleElement.textContent.trim();


        if (
            !title ||
            title === "No song selected"
        ) {

            alert(
                "Play a song first."
            );

            return;
        }


        selectedSongForPlaylist =
            getCurrentlyPlayingSong();


        if (!selectedSongForPlaylist) {

            alert(
                "Unable to identify the current song."
            );

            return;
        }


        const modal =
            document.getElementById(
                "addToPlaylistModal"
            );

        const list =
            document.getElementById(
                "addToPlaylistList"
            );


        if (!modal || !list) {
            return;
        }


        try {

            if (!playlistDatabase) {

                await openPlaylistDB();
            }


            const playlists =
                await getAllPlaylists();


            list.innerHTML = "";


            if (playlists.length === 0) {

                list.innerHTML = `
                    <div class="no-playlists-message">

                        <div style="
                            font-size: 32px;
                            margin-bottom: 10px;
                        ">
                            🎵
                        </div>

                        <div>
                            No playlists yet.
                        </div>

                        <div style="
                            margin-top: 6px;
                            font-size: 12px;
                        ">
                            Create a playlist first.
                        </div>

                    </div>
                `;

            } else {

                playlists.forEach(
                    function (playlist) {

                        const button =
                            document.createElement(
                                "button"
                            );


                        button.className =
                            "add-to-playlist-item";


                        const songCount =
                            Array.isArray(
                                playlist.songs
                            )
                                ? playlist.songs.length
                                : 0;


                        button.innerHTML = `

                            <div class="add-to-playlist-icon">
                                🎵
                            </div>

                            <div>

                                <div class="add-to-playlist-name">
                                    ${escapeHTML(
                                        playlist.name
                                    )}
                                </div>

                                <div class="add-to-playlist-count">
                                    ${songCount}
                                    ${
                                        songCount === 1
                                            ? "song"
                                            : "songs"
                                    }
                                </div>

                            </div>
                        `;


                        button.addEventListener(
                            "click",
                            function () {

                                addSongToPlaylist(
                                    playlist.id
                                );

                            }
                        );


                        list.appendChild(button);

                    }
                );
            }


            modal.classList.add("active");


        } catch (error) {

            console.error(
                "Failed to open playlist picker:",
                error
            );

            alert(
                "Could not load playlists."
            );
        }

    };


    // ==========================================
    // CLOSE WINDOW
    // ==========================================

    window.closeAddToPlaylist = function () {

        const modal =
            document.getElementById(
                "addToPlaylistModal"
            );


        if (modal) {

            modal.classList.remove(
                "active"
            );
        }


        selectedSongForPlaylist = null;
    };


    // ==========================================
    // ADD SONG TO PLAYLIST
    // ==========================================

    async function addSongToPlaylist(
        playlistId
    ) {

        if (!selectedSongForPlaylist) {
            return;
        }


        try {

            const playlists =
                await getAllPlaylists();


            const playlist =
                playlists.find(
                    function (item) {

                        return item.id ===
                            playlistId;
                    }
                );


            if (!playlist) {

                alert(
                    "Playlist not found."
                );

                return;
            }


            if (!Array.isArray(
                playlist.songs
            )) {

                playlist.songs = [];
            }


            const alreadyExists =
                playlist.songs.some(
                    function (song) {

                        return song.id ===
                            selectedSongForPlaylist.id;
                    }
                );


            if (alreadyExists) {

                alert(
                    "This song is already in the playlist."
                );

                return;
            }


            playlist.songs.push(
                selectedSongForPlaylist
            );


            await updatePlaylist(
                playlist
            );

//Save the names before closing the modal
const addedSongTitle =
    selectedSongForPlaylist.title;

const addedPlaylistName =
    playlist.name;

            closeAddToPlaylist();


            if (
                typeof window.renderPlaylists ===
                "function"
            ) {

                window.renderPlaylists();
            }


            alert(
                `"${addedSongTitle}" added to "${addedPlaylistName}".`
            );


        } catch (error) {

            console.error(
                "Failed to add song:",
                error
            );

            alert(
                "Could not add song to playlist."
            );
        }

    }


    // ==========================================
    // GET CURRENTLY PLAYING SONG
    // ==========================================

    function getCurrentlyPlayingSong() {

        const titleElement =
            document.getElementById(
                "playerTitle"
            );

        const artistElement =
            document.getElementById(
                "playerArtist"
            );

        const imageElement =
            document.getElementById(
                "playerImage"
            );


        if (!titleElement) {
            return null;
        }


        const title =
            titleElement.textContent.trim();


        const artist =
            artistElement
                ? artistElement.textContent.trim()
                : "Unknown Artist";


        const image =
            imageElement
                ? imageElement.src
                : "";


        if (
            !title ||
            title === "No song selected"
        ) {

            return null;
        }


        const onlineId =
            window.flowTuneCurrentYouTubeVideoId ||
            window.currentYouTubeVideoId ||
            null;


        return {

            id:
                onlineId
                    ? "youtube_" + onlineId
                    : "song_" + normalizeSongId(title),

            title: title,

            artist: artist,

            image: image,

            source:
                onlineId
                    ? "youtube"
                    : "flowtune",

            videoId:
                onlineId || null,

            addedAt:
                new Date().toISOString()
        };
    }


    // ==========================================
    // CREATE SAFE SONG ID
    // ==========================================

    function normalizeSongId(text) {

        return String(text)
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "_"
            )
            .replace(
                /^_+|_+$/g,
                ""
            );
    }


    // ==========================================
    // PROTECT HTML
    // ==========================================

    function escapeHTML(text) {

        return String(text)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ==========================================
    // INITIALIZE
    // ==========================================

    async function initializeAddToPlaylist() {

        try {

            await openPlaylistDB();

            console.log(
                "FlowTune Add to Playlist ready"
            );

        } catch (error) {

            console.error(
                "Add to Playlist initialization failed:",
                error
            );
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAddToPlaylist
        );

    } else {

        initializeAddToPlaylist();
    }

})();

// ==========================================
// FLOWTUNE - PLAYLIST DETAILS
// STEP 3
// ==========================================

(function () {

    const DB_NAME = "FlowTunePlaylistsDB";
    const DB_VERSION = 1;
    const STORE_NAME = "playlists";

    let playlistDB = null;
    let activePlaylist = null;


    // ==========================================
    // OPEN DATABASE
    // ==========================================

    function openPlaylistDatabase() {

        return new Promise((resolve, reject) => {

            if (playlistDB) {
                resolve(playlistDB);
                return;
            }

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );

            request.onsuccess =
                function (event) {

                    playlistDB =
                        event.target.result;

                    resolve(playlistDB);
                };

            request.onerror =
                function () {

                    reject(request.error);
                };
        });
    }


    // ==========================================
    // GET PLAYLISTS
    // ==========================================

    function getPlaylists() {

        return new Promise((resolve, reject) => {

            const transaction =
                playlistDB.transaction(
                    STORE_NAME,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            const request =
                store.getAll();

            request.onsuccess =
                function () {

                    resolve(
                        request.result || []
                    );
                };

            request.onerror =
                function () {

                    reject(request.error);
                };
        });
    }


    // ==========================================
    // SAVE PLAYLIST
    // ==========================================

    function savePlaylist(playlist) {

        return new Promise((resolve, reject) => {

            const transaction =
                playlistDB.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            const request =
                store.put(playlist);

            request.onsuccess =
                function () {

                    resolve();
                };

            request.onerror =
                function () {

                    reject(request.error);
                };
        });
    }


    // ==========================================
    // OPEN PLAYLIST DETAILS
    // ==========================================

    window.openPlaylistDetails =
        async function (playlistId) {

            try {

                if (!playlistDB) {
                    await openPlaylistDatabase();
                }

                const playlists =
                    await getPlaylists();

                const playlist =
                    playlists.find(
                        function (item) {

                            return item.id ===
                                playlistId;
                        }
                    );

                if (!playlist) {

                    alert(
                        "Playlist not found."
                    );

                    return;
                }

                activePlaylist = playlist;

                renderPlaylistDetails();

                const playlistGrid =
                    document.getElementById(
                        "playlistGrid"
                    );

                const playlistDetails =
                    document.getElementById(
                        "playlistDetails"
                    );

                if (playlistGrid) {
                    playlistGrid.style.display =
                        "none";
                }

                if (playlistDetails) {

                    playlistDetails.classList.remove(
                        "hidden"
                    );
                }

            } catch (error) {

                console.error(
                    "Could not open playlist:",
                    error
                );

                alert(
                    "Could not open playlist."
                );
            }
        };


    // ==========================================
    // RENDER PLAYLIST
    // ==========================================

    function renderPlaylistDetails() {

        if (!activePlaylist) {
            return;
        }

        const titleElement =
            document.getElementById(
                "playlistDetailsTitle"
            );

        const countElement =
            document.getElementById(
                "playlistDetailsCount"
            );

        const listElement =
            document.getElementById(
                "playlistSongList"
            );


        const songs =
            Array.isArray(
                activePlaylist.songs
            )
                ? activePlaylist.songs
                : [];


        if (titleElement) {

            titleElement.textContent =
                activePlaylist.name;
        }


        if (countElement) {

            countElement.textContent =
                `${songs.length} ${
                    songs.length === 1
                        ? "song"
                        : "songs"
                }`;
        }


        if (!listElement) {
            return;
        }


        listElement.innerHTML = "";


        if (songs.length === 0) {

            listElement.innerHTML = `
                <div class="empty-playlist-message">
                    This playlist is empty.
                </div>
            `;

            return;
        }


        songs.forEach(
            function (song, index) {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "playlist-song-item";


                const image =
                    song.image ||
                    "https://picsum.photos/100";


                item.innerHTML = `

                    <img
                        class="playlist-song-image"
                        src="${escapeHTML(image)}"
                        alt=""
                    >

                    <div class="playlist-song-info">

                        <div class="playlist-song-title">
                            ${escapeHTML(
                                song.title ||
                                "Unknown Song"
                            )}
                        </div>

                        <div class="playlist-song-artist">
                            ${escapeHTML(
                                song.artist ||
                                "Unknown Artist"
                            )}
                        </div>

                    </div>

                    <div class="playlist-song-buttons">

                        <button
                            class="playlist-song-play"
                            title="Play"
                            data-index="${index}"
                        >
                            ▶
                        </button>

                        <button
                            class="playlist-song-remove"
                            title="Remove"
                            data-index="${index}"
                        >
                            ×
                        </button>

                    </div>
                `;


                const playButton =
                    item.querySelector(
                        ".playlist-song-play"
                    );

                const removeButton =
                    item.querySelector(
                        ".playlist-song-remove"
                    );


                playButton.addEventListener(
                    "click",
                    function () {

                        playPlaylistSong(
                            index
                        );
                    }
                );


                removeButton.addEventListener(
                    "click",
                    function () {

                        removePlaylistSong(
                            index
                        );
                    }
                );


                listElement.appendChild(
                    item
                );
            }
        );
    }


    // ==========================================
    // PLAY ONE PLAYLIST SONG
    // ==========================================

    function playPlaylistSong(index) {

        if (!activePlaylist) {
            return;
        }


        const songs =
            activePlaylist.songs || [];


        const song =
            songs[index];


        if (!song) {
            return;
        }


        // YouTube song
        if (
            song.source === "youtube" &&
            song.videoId
        ) {

            if (
                typeof window.playYouTubeSong ===
                "function"
            ) {

                window.playYouTubeSong(
                    song.videoId,
                    song.title,
                    song.artist,
                    song.image
                );

                return;
            }
        }


        // Local FlowTune song
        if (
            song.source === "flowtune"
        ) {

            try {

                if (
                    typeof allSongs !==
                    "undefined" &&
                    Array.isArray(allSongs)
                ) {

                    const localIndex =
                        allSongs.findIndex(
                            function (item) {

                                return (
                                    String(
                                        item.title
                                    ).toLowerCase() ===
                                    String(
                                        song.title
                                    ).toLowerCase()
                                );
                            }
                        );


                    if (
                        localIndex !== -1 &&
                        typeof playSong ===
                        "function"
                    ) {

                        playSong(
                            localIndex
                        );

                        return;
                    }
                }

            } catch (error) {

                console.error(
                    "Local playlist playback error:",
                    error
                );
            }
        }


        alert(
            "This song could not be played."
        );
    }


    // ==========================================
    // PLAY ALL
    // ==========================================

    window.playPlaylistAll =
        function () {

            if (!activePlaylist) {
                return;
            }

            const songs =
                activePlaylist.songs || [];


            if (songs.length === 0) {

                alert(
                    "This playlist is empty."
                );

                return;
            }


            playPlaylistSong(0);
        };


    // ==========================================
    // SHUFFLE
    // ==========================================

    window.shufflePlaylist =
        function () {

            if (!activePlaylist) {
                return;
            }

            const songs =
                activePlaylist.songs || [];


            if (songs.length === 0) {

                alert(
                    "This playlist is empty."
                );

                return;
            }


            const randomIndex =
                Math.floor(
                    Math.random() *
                    songs.length
                );


            playPlaylistSong(
                randomIndex
            );
        };


    // ==========================================
    // REMOVE SONG
    // ==========================================

    async function removePlaylistSong(index) {

        if (!activePlaylist) {
            return;
        }


        const songs =
            activePlaylist.songs || [];


        const song =
            songs[index];


        if (!song) {
            return;
        }


        const confirmed =
            confirm(
                `Remove "${song.title}" from "${activePlaylist.name}"?`
            );


        if (!confirmed) {
            return;
        }


        activePlaylist.songs.splice(
            index,
            1
        );


        try {

            await savePlaylist(
                activePlaylist
            );


            renderPlaylistDetails();


            if (
                typeof window.renderPlaylists ===
                "function"
            ) {

                window.renderPlaylists();
            }


        } catch (error) {

            console.error(
                "Could not remove song:",
                error
            );

            alert(
                "Could not remove song."
            );
        }
    }


    // ==========================================
    // CLOSE PLAYLIST DETAILS
    // ==========================================

    window.closePlaylistDetails =
        function () {

            activePlaylist = null;


            const playlistGrid =
                document.getElementById(
                    "playlistGrid"
                );

            const playlistDetails =
                document.getElementById(
                    "playlistDetails"
                );


            if (playlistDetails) {

                playlistDetails.classList.add(
                    "hidden"
                );
            }


            if (playlistGrid) {

                playlistGrid.style.display =
                    "";
            }
        };


    // ==========================================
    // MAKE EXISTING PLAYLIST CARDS CLICKABLE
    // ==========================================

    function setupPlaylistClickHandler() {

        const playlistGrid =
            document.getElementById(
                "playlistGrid"
            );


        if (!playlistGrid) {
            return;
        }


        playlistGrid.addEventListener(
            "click",
            function (event) {

                // Don't intercept buttons
                // inside playlist cards.

                if (
                    event.target.closest(
                        "button"
                    )
                ) {
                    return;
                }


                const card =
                    event.target.closest(
                        "[data-playlist-id]"
                    );


                if (!card) {
                    return;
                }


                const playlistId =
                    card.dataset.playlistId;


                if (playlistId) {

                    openPlaylistDetails(
                        playlistId
                    );
                }
            }
        );
    }


    // ==========================================
    // HTML SAFETY
    // ==========================================

    function escapeHTML(text) {

        return String(text)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ==========================================
    // INITIALIZE
    // ==========================================

    function initializePlaylistDetails() {

        openPlaylistDatabase()
            .then(
                function () {

                    console.log(
                        "FlowTune Playlist Details ready"
                    );
                }
            )
            .catch(
                function (error) {

                    console.error(
                        "Playlist Details initialization failed:",
                        error
                    );
                }
            );


        setupPlaylistClickHandler();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializePlaylistDetails
        );

    } else {

        initializePlaylistDetails();
    }

})();