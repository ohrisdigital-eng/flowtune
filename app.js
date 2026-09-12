// ==========================================
// TUNEFLOW - MAIN APP
// Permanent Music Storage with IndexedDB
// ==========================================

let currentSongIndex = -1;
let allSongs = [];

let audioPlayer;
let playButton;
let playerTitle;
let playerArtist;
let playerImage;

const DB_NAME = "TuneFlowDB";
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
// SAVE SONG TO DATABASE
// ==========================================

async function saveSongToDatabase(song) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readwrite");

        const store =
            transaction.objectStore(STORE_NAME);

        const request = store.put(song);

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };

    });

}


// ==========================================
// GET ALL UPLOADED SONGS
// ==========================================

async function getStoredSongs() {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readonly");

        const store =
            transaction.objectStore(STORE_NAME);

        const request = store.getAll();

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

        // Songs from songs.js
        allSongs = Array.isArray(window.songs)
            ? [...window.songs]
            : [];

        // Uploaded songs
        const storedSongs =
            await getStoredSongs();

        storedSongs.forEach(song => {

            // Create fresh URLs after every page load
            if (song.audioBlob) {

                song.audio =
                    URL.createObjectURL(song.audioBlob);

            }

            if (song.coverBlob) {

                song.image =
                    URL.createObjectURL(song.coverBlob);

            }

            allSongs.push(song);

        });

        console.log(
            "TuneFlow songs:",
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

        console.log(
            "songGrid not found"
        );

        return;

    }

    grid.innerHTML = "";

    if (allSongs.length === 0) {

        grid.innerHTML = `
            <div class="no-results">
                <h2>No songs yet 🎵</h2>
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
                src="${escapeHTML(song.image || "https://picsum.photos/300")}"
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
                ▶ Play
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

            if (playButton) {
                playButton.textContent = "⏸";
            }

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

    const player = documen.getElementById("player");

    if (audioPlayer.paused) {
        player.classList.remove("playing");
    } else {
        player.classList.add("playing");
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
        previous = allSongs.length - 1;
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
        document.getElementById(
            "volumeSlider"
        );

    if (slider) {

        audioPlayer.volume =
            Number(slider.value) / 100;

    }

}


// ==========================================
// ADD MUSIC
// ==========================================

const addMusicForm =
    document.getElementById(
        "addMusicForm"
    );

if (addMusicForm) {

    addMusicForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const musicFile =
                document.getElementById(
                    "musicFile"
                ).files[0];

            const coverFile =
                document.getElementById(
                    "coverFile"
                ).files[0];

            const title =
                document.getElementById(
                    "songTitle"
                ).value.trim();

            const artist =
                document.getElementById(
                    "songArtist"
                ).value.trim();

            const album =
                document.getElementById(
                    "songAlbum"
                ).value.trim();

            const genre =
                document.getElementById(
                    "songGenre"
                ).value;


            // Validation
            if (!musicFile) {

                alert(
                    "Please choose an MP3 file."
                );

                return;

            }

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
                        album || "Unknown Album",

                    genre:
                        genre || "Other",

                    audioBlob:
                        musicFile,

                    coverBlob:
                        coverFile || null,

                    // Temporary URLs
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


                // Save permanently
                await saveSongToDatabase(
                    newSong
                );


                // Add immediately
                allSongs.push(
                    newSong
                );


                renderSongs();


                // Success message
                const message =
                    document.getElementById(
                        "addMusicMessage"
                    );

                if (message) {

                    message.textContent =
                        "✅ Song added successfully!";

                    message.className =
                        "add-music-message success";

                } else {

                    alert(
                        "✅ Song added successfully!"
                    );

                }


                // Reset form
                addMusicForm.reset();


                console.log(
                    "Song saved:",
                    newSong
                );


            } catch (error) {

                console.error(
                    "Could not save song:",
                    error
                );

                alert(
                    "❌ Could not save the song."
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
                        src="${escapeHTML(song.image)}"
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
                        ▶
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

    // Hide all pages
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    //Show selected page
    const selectedpage = document.getElementById(page + "Page");

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }

    //Remove active class from all sidebar buttons
    document.querySelectorAll(".sidebar nav button").forEach(button => {
        button.classList.remove("active");
    });

    //Set active button
    const buttons = document.querySelectorAll(".sidebar nav button");

    const pageButtonMap = {
        home: 0,
        search: 1,
        library: 2,
        addMusic: 3
    };

    const buttonIndex = pageButtonMap[pageName];

    if (buttonIndex !== undefined && buttons[buttonIndex]) {
        buttons[buttonIndex].classList.add("activde");
    }

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.add(
                "hidden"
            );

        });


    const page =
        document.getElementById(
            pageName + "Page"
        );


    if (page) {

        page.classList.remove(
            "hidden"
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
// INITIALIZE
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


        if (audioPlayer) {

            audioPlayer.addEventListener(
                "play",
                function() {

                    if (playButton) {
                        playButton.textContent =
                            "⏸";
                    }

                }
            );


            audioPlayer.addEventListener(
                "pause",
                function() {

                    if (playButton) {
                        playButton.textContent =
                            "▶";
                    }

                }
            );


            audioPlayer.addEventListener(
                "ended",
                function() {

                    nextSong();

                }
            );

        }


        await loadSongs();

        changeVolume();

        console.log(
            "🎵 TuneFlow is ready!"
        );

    }
);

// ==========================================
// FLOWTUNE - MUSIC MOOD ENGINE
// ==========================================

function seletMood(mood) {

    //find songs matching the selected mood
    const moodSongs = songs.filter(song =>
        song.mood &&
        song.mood.toLowerCase( ) === mood.toLowerCase( )
    );

    //Show selected mood
    const selectedMood = document.getElementById("selectedMood");

    if (!selectedMood) return;

    if (moodSongs.length === 0) {
        selectedMood.textContent =
        "No songs available for " + mood + "yet.";
        return;
    }

    selectedMood.textContent =
    mood + "mood selected •" +
    moodSongs.length + " Song" +
    (moodSongs.length > 1 ? "s" : "") +
    " found";
    
    // Show matching songs
    displayMoodSongs(moodSongs);
}

function displayMoodSongs(moodSongs) {

    const songGrid =
        document.querySelector(".song-grid");

    if (!songGrid) return;

    songGrid.innerHTML = "";

    moodSongs.forEach(song => {

        const card = document.createElement("div");

        card.className = "song-card";
        
        card.innerHTML = `
            <img src="${song.image}" alt="${song.title}">
            <h3>${song.title}</h3>
            <p>${song.artist}</p>
        `;

        card.addEventListener("click", () => {
            playSong(song);
        });

        songGrid.appendChild(card);
    });
}