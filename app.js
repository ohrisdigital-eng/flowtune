// ==========================================
// FLOWTUNE - MAIN APP
// Music Player + IndexedDB + Mood Engine
// ==========================================

let currentSongIndex = -1;
let allSongs = [];

let audioPlayer;
let playButton;
let playerTitle;
let playerArtist;
let playerImage;

const DB_NAME = "FlowTuneDB";
const DB_VERSION = 1;
const STORE_NAME = "songs";


// ==========================================
// DATABASE
// ==========================================

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {

            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {

                db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });

            }

        };

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };

    });

}


// ==========================================
// SAVE SONG
// ==========================================

async function saveSongToDatabase(song) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readwrite");

        const store =
            transaction.objectStore(STORE_NAME);

        const request =
            store.put(song);

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };

    });

}


// ==========================================
// GET STORED SONGS
// ==========================================

async function getStoredSongs() {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readonly");

        const store =
            transaction.objectStore(STORE_NAME);

        const request =
            store.getAll();

        request.onsuccess = function() {
            resolve(request.result || []);
        };

        request.onerror = function() {
            reject(request.error);
        };

    });

}


// ==========================================
// LOAD SONGS
// ==========================================

async function loadSongs() {

    try {

        // Built-in songs from songs.js
        allSongs = Array.isArray(window.songs)
            ? [...window.songs]
            : [];

        // Uploaded songs from IndexedDB
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
// RENDER SONG CARDS
// ==========================================

function renderSongs() {

    const grid =
        document.getElementById("songGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    if (allSongs.length === 0) {

        grid.innerHTML = `
            <div class="no-results">
                <h2>No songs yet</h2>
                <p>Use Add Music to upload your first song.</p>
            </div>
        `;

        return;

    }

    allSongs.forEach((song, index) => {

        const card =
            document.createElement("div");

        card.className = "song-card";

        card.innerHTML = `
            <img
                src="${escapeHTML(
                    song.image ||
                    "https://picsum.photos/300"
                )}"
                alt="${escapeHTML(song.title)}"
            >

            <h3>
                ${escapeHTML(song.title)}
            </h3>

            <p>
                ${escapeHTML(song.artist)}
            </p>

            <button
                onclick="playSong(${index})"
            >
                Play
            </button>
        `;

        grid.appendChild(card);

    });

}


// ==========================================
// PLAY SONG
// ==========================================

function playSong(index) {

    const song = allSongs[index];

    if (!song || !audioPlayer) {
        return;
    }

    currentSongIndex = index;

    audioPlayer.src = song.audio;

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

    audioPlayer.play()
        .then(() => {

            updatePlayButton();

        })
        .catch(error => {

            console.error(
                "Audio playback error:",
                error
            );

        });

}


// ==========================================
// PLAY FIRST SONG
// ==========================================

function playFirstSong() {

    if (allSongs.length > 0) {

        playSong(0);

    }

}


// ==========================================
// PLAY / PAUSE
// ==========================================

function togglePlay() {

    if (!audioPlayer) {
        return;
    }

    if (!audioPlayer.src) {

        playFirstSong();

        return;

    }

    if (audioPlayer.paused) {

        audioPlayer.play();

    } else {

        audioPlayer.pause();

    }

}


// ==========================================
// UPDATE PLAY BUTTON
// ==========================================

function updatePlayButton() {

    if (!playButton || !audioPlayer) {
        return;
    }

    if (audioPlayer.paused) {

        playButton.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M8 5 L19 12 L8 19 Z"></path>
            </svg>
        `;

    } else {

        playButton.innerHTML = `
            <svg viewBox="0 0 24 24">
                <rect x="7" y="5" width="3" height="14"></rect>
                <rect x="14" y="5" width="3" height="14"></rect>
            </svg>
        `;

    }

}


// ==========================================
// NEXT SONG
// ==========================================

function nextSong() {

    if (allSongs.length === 0) {
        return;
    }

    let next =
        currentSongIndex + 1;

    if (next >= allSongs.length) {

        next = 0;

    }

    playSong(next);

}


// ==========================================
// PREVIOUS SONG
// ==========================================

function previousSong() {

    if (allSongs.length === 0) {
        return;
    }

    let previous =
        currentSongIndex - 1;

    if (previous < 0) {

        previous =
            allSongs.length - 1;

    }

    playSong(previous);

}


// ==========================================
// VOLUME
// ==========================================

function changeVolume() {

    if (!audioPlayer) {
        return;
    }

    const slider =
        document.getElementById("volumeControl");

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
        async function(event) {

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


            // Validate music
            if (!musicFile) {

                alert(
                    "Please choose a music file."
                );

                return;

            }


            // Validate title and artist
            if (!title || !artist) {

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
                        coverFile || null,

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


                // Save to IndexedDB
                await saveSongToDatabase(
                    newSong
                );


                // Add to current list
                allSongs.push(
                    newSong
                );


                // Refresh cards
                renderSongs();


                // Success message
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


                // Reset form
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
// SEARCH
// ==========================================

function searchSongs() {

    const input =
        document.getElementById(
            "searchInput"
        );

    const results =
        document.getElementById(
            "searchResults"
        );

    if (!input || !results) {
        return;
    }

    const query =
        input.value
            .toLowerCase()
            .trim();

    results.innerHTML = "";

    if (!query) {
        return;
    }

    showPage("search");


    allSongs.forEach(
        (song, index) => {

            const text = (

                song.title +
                " " +
                song.artist +
                " " +
                song.album +
                " " +
                song.genre

            ).toLowerCase();


            if (text.includes(query)) {

                const result =
                    document.createElement(
                        "div"
                    );

                result.className =
                    "search-result";

                result.innerHTML = `
                    <img
                        src="${escapeHTML(
                            song.image ||
                            "https://picsum.photos/300"
                        )}"
                        alt=""
                    >

                    <div>
                        <h3>
                            ${escapeHTML(song.title)}
                        </h3>

                        <p>
                            ${escapeHTML(song.artist)}
                        </p>
                    </div>

                    <button
                        onclick="playSong(${index})"
                    >
                        Play
                    </button>
                `;

                results.appendChild(
                    result
                );

            }

        }
    );

}


// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.add(
                "hidden"
            );

        });


    const selectedPage =
        document.getElementById(
            pageName + "Page"
        );


    if (selectedPage) {

        selectedPage.classList.remove(
            "hidden"
        );

    }


    // Sidebar active buttons
    document
        .querySelectorAll(
            ".sidebar nav button"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


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
            .classList.add("active");

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value || "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// ==========================================
// MOOD ENGINE
// ==========================================

function selectMood(mood) {

    const moodSongs =
        allSongs.filter(song =>

            song.mood &&
            song.mood.toLowerCase() ===
            mood.toLowerCase()

        );


    const selectedMood =
        document.getElementById(
            "selectedMood"
        );


    if (!selectedMood) {
        return;
    }


    if (moodSongs.length === 0) {

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


    moodSongs.forEach(song => {

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

            <button>
                Play
            </button>
        `;


        card.addEventListener(
            "click",
            function(event) {

                if (
                    event.target.tagName ===
                    "BUTTON"
                ) {

                    const index =
                        allSongs.indexOf(
                            song
                        );

                    if (index !== -1) {
                        playSong(index);
                    }

                }

            }
        );


        songGrid.appendChild(
            card
        );

    });

}


// ==========================================
// INITIALIZE APP
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

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


        // Audio events
        if (audioPlayer) {

            audioPlayer.addEventListener(
                "play",
                function() {

                    updatePlayButton();

                }
            );


            audioPlayer.addEventListener(
                "pause",
                function() {

                    updatePlayButton();

                }
            );


            audioPlayer.addEventListener(
                "ended",
                function() {

                    nextSong();

                }
            );

        }


        // Add Music
        setupAddMusic();


        // Load songs
        await loadSongs();


        // Volume
        changeVolume();


        console.log(
            "FlowTune is ready."
        );

    }
);
