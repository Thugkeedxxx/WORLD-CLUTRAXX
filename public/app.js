const fileGrid =
    document.getElementById("fileGrid");

const fileCount =
    document.getElementById("fileCount");

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const categorySelect =
    document.getElementById("categorySelect");

const musicGrid =
    document.getElementById("musicGrid");

const whatsappButton =
    document.getElementById("whatsappButton");

const menuButton =
    document.getElementById("menuButton");

const navigation =
    document.getElementById("navigation");


/*
|--------------------------------------------------------------------------
| MOBILE MENU
|--------------------------------------------------------------------------
*/

menuButton.addEventListener(
    "click",
    () => {

        navigation.classList.toggle(
            "open"
        );

    }
);


/*
|--------------------------------------------------------------------------
| FILE SIZE
|--------------------------------------------------------------------------
*/

function formatBytes(bytes) {

    if (!bytes) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return (
        parseFloat(
            (
                bytes /
                Math.pow(1024, index)
            ).toFixed(1)
        ) +
        " " +
        units[index]
    );
}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/*
|--------------------------------------------------------------------------
| LOAD FILES
|--------------------------------------------------------------------------
*/

async function loadFiles() {

    loading.classList.remove("hidden");

    emptyState.classList.add("hidden");

    fileGrid.innerHTML = "";

    try {

        const params =
            new URLSearchParams();

        const search =
            searchInput.value.trim();

        const category =
            categorySelect.value;

        if (search) {
            params.set(
                "search",
                search
            );
        }

        if (category) {
            params.set(
                "category",
                category
            );
        }

        const response =
            await fetch(
                `/api/files?${params.toString()}`
            );

        if (!response.ok) {
            throw new Error(
                "Could not load files"
            );
        }

        const data =
            await response.json();

        loading.classList.add(
            "hidden"
        );

        fileCount.textContent =
            `${data.count} ${
                data.count === 1
                    ? "file"
                    : "files"
            }`;

        if (
            !data.files ||
            data.files.length === 0
        ) {

            emptyState.classList.remove(
                "hidden"
            );

            return;
        }

        data.files.forEach(
            file => {

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "file-card";

                card.innerHTML = `

                    <div class="file-icon">
                        📁
                    </div>

                    <div class="file-category">
                        ${escapeHTML(file.category)}
                    </div>

                    <h3>
                        ${escapeHTML(file.name)}
                    </h3>

                    <p class="file-description">
                        ${
                            escapeHTML(
                                file.description ||
                                "Configuration file"
                            )
                        }
                    </p>

                    <div class="file-meta">

                        <span>
                            ${formatBytes(file.size)}
                        </span>

                        <span>
                            ${file.downloads}
                            downloads
                        </span>

                    </div>

                    <button
                        class="download-button"
                        data-id="${escapeHTML(file.id)}"
                    >
                        Download File
                    </button>

                `;

                fileGrid.appendChild(card);

            }
        );

        document
            .querySelectorAll(
                ".download-button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        window.location.href =
                            `/api/download/${encodeURIComponent(id)}`;

                    }
                );

            });

    } catch (error) {

        loading.classList.add(
            "hidden"
        );

        fileGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Could not connect
                </h3>

                <p>
                    The file service is
                    currently unavailable.
                </p>

            </div>

        `;

        console.error(error);
    }
}


/*
|--------------------------------------------------------------------------
| MUSIC PLATFORM CARDS
|--------------------------------------------------------------------------
*/

function createMusicCard(
    name,
    description,
    url
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "music-card";

    const valid =
        typeof url === "string" &&
        /^https?:\/\//i.test(
            url.trim()
        );

    card.innerHTML = `

        <h3>
            ${escapeHTML(name)}
        </h3>

        <p>
            ${escapeHTML(description)}
        </p>

        <a
            class="music-button ${
                valid
                    ? ""
                    : "music-disabled"
            }"
            href="${
                valid
                    ? escapeHTML(url)
                    : "#"
            }"
            ${
                valid
                    ? `
                        target="_blank"
                        rel="noopener noreferrer"
                      `
                    : ""
            }
        >
            ${
                valid
                    ? "Listen Now"
                    : "Link Coming Soon"
            }
        </a>

    `;

    return card;
}


/*
|--------------------------------------------------------------------------
| LOAD SETTINGS
|--------------------------------------------------------------------------
*/

async function loadSettings() {

    try {

        const response =
            await fetch(
                "/api/settings"
            );

        if (!response.ok) {
            throw new Error(
                "Settings request failed"
            );
        }

        const data =
            await response.json();

        const settings =
            data.settings || {};

        const music =
            settings.music || {};

        const community =
            settings.community || {};

        musicGrid.innerHTML = "";

        const platforms = [

            [
                "Spotify",
                "Stream on Spotify",
                music.spotify
            ],

            [
                "TIDAL",
                "Stream on TIDAL",
                music.tidal
            ],

            [
                "Amazon Music",
                "Listen on Amazon Music",
                music.amazonMusic
            ],

            [
                "Audiomack",
                "Listen on Audiomack",
                music.audiomack
            ],

            [
                "SoundCloud",
                "Listen on SoundCloud",
                music.soundcloud
            ]

        ];

        platforms.forEach(
            platform => {

                musicGrid.appendChild(
                    createMusicCard(
                        platform[0],
                        platform[1],
                        platform[2]
                    )
                );

            }
        );


        if (
            typeof community.whatsapp ===
            "string" &&
            /^https?:\/\//i.test(
                community.whatsapp.trim()
            )
        ) {

            whatsappButton.href =
                community.whatsapp;

            whatsappButton.classList.remove(
                "disabled"
            );

        } else {

            whatsappButton.href =
                "#";

            whatsappButton.classList.add(
                "disabled"
            );

        }

    } catch (error) {

        console.error(error);

        musicGrid.innerHTML = `

            <div class="music-loading">
                Music links could not be loaded.
            </div>

        `;

    }

}


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

let searchTimer;

searchInput.addEventListener(
    "input",
    () => {

        clearTimeout(searchTimer);

        searchTimer =
            setTimeout(
                loadFiles,
                300
            );

    }
);


/*
|--------------------------------------------------------------------------
| CATEGORY FILTER
|--------------------------------------------------------------------------
*/

categorySelect.addEventListener(
    "change",
    loadFiles
);


/*
|--------------------------------------------------------------------------
| YEAR
|--------------------------------------------------------------------------
*/

document.getElementById(
    "year"
).textContent =
    new Date().getFullYear();


/*
|--------------------------------------------------------------------------
| START APPLICATION
|--------------------------------------------------------------------------
*/

loadFiles();

loadSettings();