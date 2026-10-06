const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");

const app = express();

const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "CHANGE_THIS_PASSWORD";

const ROOT_DIR = __dirname;

const DATA_DIR =
    path.join(ROOT_DIR, "data");

const STORAGE_DIR =
    process.env.RENDER
        ? "/opt/render/project/src/storage"
        : path.join(ROOT_DIR, "storage");

const UPLOAD_DIR =
    path.join(STORAGE_DIR, "uploads");

const FILES_DB =
    path.join(DATA_DIR, "files.json");

const SETTINGS_DB =
    path.join(DATA_DIR, "settings.json");


/* =========================================================
   CREATE DIRECTORIES
========================================================= */

fs.mkdirSync(DATA_DIR, {
    recursive: true
});

fs.mkdirSync(UPLOAD_DIR, {
    recursive: true
});


/* =========================================================
   DEFAULT DATA
========================================================= */

const DEFAULT_FILES = [];

const DEFAULT_SETTINGS = {

    music: {

        spotify: "",

        tidal: "",

        amazonMusic: "",

        audiomack: "",

        soundcloud: ""

    },

    community: {

        whatsapp: ""

    }

};


/* =========================================================
   DATABASE HELPERS
========================================================= */

function readJSON(
    file,
    fallback
) {

    try {

        if (
            !fs.existsSync(file)
        ) {

            fs.writeFileSync(
                file,
                JSON.stringify(
                    fallback,
                    null,
                    2
                )
            );

            return fallback;

        }


        const content =
            fs.readFileSync(
                file,
                "utf8"
            );


        if (!content.trim()) {

            return fallback;

        }


        return JSON.parse(content);

    } catch (error) {

        console.error(
            "JSON read error:",
            error
        );

        return fallback;

    }

}


function writeJSON(
    file,
    data
) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}


/* =========================================================
   EXPRESS CONFIG
========================================================= */

app.use(
    express.json({
        limit: "2mb"
    })
);


app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);


app.use(
    cookieParser()
);


/* =========================================================
   SECURITY HEADERS
========================================================= */

app.disable("x-powered-by");


app.use(
    (req, res, next) => {

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );

        res.setHeader(
            "X-Frame-Options",
            "SAMEORIGIN"
        );

        res.setHeader(
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
        );

        next();

    }
);


/* =========================================================
   STATIC WEBSITE
========================================================= */

app.use(
    express.static(
        path.join(
            ROOT_DIR,
            "public"
        )
    )
);


/* =========================================================
   MULTER STORAGE
========================================================= */

const storage =
    multer.diskStorage({

        destination: (
            req,
            file,
            cb
        ) => {

            cb(
                null,
                UPLOAD_DIR
            );

        },


        filename: (
            req,
            file,
            cb
        ) => {

            const extension =
                path.extname(
                    file.originalname
                );


            const randomName =
                crypto
                    .randomBytes(16)
                    .toString("hex");


            cb(
                null,
                randomName +
                extension
            );

        }

    });


const upload =
    multer({

        storage,

        limits: {

            fileSize:
                25 * 1024 * 1024

        }

    });


/* =========================================================
   ADMIN SESSION
========================================================= */

const adminSessions =
    new Map();


function createSession() {

    const token =
        crypto
            .randomBytes(32)
            .toString("hex");


    adminSessions.set(
        token,
        {
            createdAt:
                Date.now()
        }
    );


    return token;

}


function isAdmin(
    req
) {

    const token =
        req.cookies.admin_session;


    if (!token) {

        return false;

    }


    const session =
        adminSessions.get(
            token
        );


    if (!session) {

        return false;

    }


    /*
     * Session expires after 24 hours.
     */

    const maxAge =
        24 * 60 * 60 * 1000;


    if (
        Date.now() -
        session.createdAt >
        maxAge
    ) {

        adminSessions.delete(
            token
        );

        return false;

    }


    return true;

}


/* =========================================================
   ADMIN MIDDLEWARE
========================================================= */

function requireAdmin(
    req,
    res,
    next
) {

    if (!isAdmin(req)) {

        return res
            .status(401)
            .json({
                error:
                    "Administrator authentication required."
            });

    }


    next();

}


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            status: "ok",

            service:
                "WORLD CLUTRA888",

            time:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   GET PUBLIC FILES
========================================================= */

app.get(
    "/api/files",
    (req, res) => {

        const files =
            readJSON(
                FILES_DB,
                DEFAULT_FILES
            );


        const search =
            String(
                req.query.search || ""
            )
            .trim()
            .toLowerCase();


        const category =
            String(
                req.query.category || ""
            )
            .trim();


        const filtered =
            files.filter(
                file => {

                    const name =
                        String(
                            file.name || ""
                        )
                        .toLowerCase();


                    const description =
                        String(
                            file.description || ""
                        )
                        .toLowerCase();


                    const fileCategory =
                        String(
                            file.category || ""
                        );


                    const matchesSearch =
                        !search ||
                        name.includes(
                            search
                        ) ||
                        description.includes(
                            search
                        ) ||
                        fileCategory
                            .toLowerCase()
                            .includes(
                                search
                            );


                    const matchesCategory =
                        !category ||
                        category === "all" ||
                        fileCategory ===
                            category;


                    return (
                        matchesSearch &&
                        matchesCategory
                    );

                }
            );


        res.json({

            files:
                filtered.map(
                    publicFile
                )

        });

    }
);


/* =========================================================
   PUBLIC SETTINGS
========================================================= */

app.get(
    "/api/settings",
    (req, res) => {

        const settings =
            readJSON(
                SETTINGS_DB,
                DEFAULT_SETTINGS
            );


        res.json({

            settings

        });

    }
);


/* =========================================================
   DOWNLOAD FILE
========================================================= */

app.get(
    "/api/download/:id",
    (req, res) => {

        const files =
            readJSON(
                FILES_DB,
                DEFAULT_FILES
            );


        const file =
            files.find(
                item =>
                    item.id ===
                    req.params.id
            );


        if (!file) {

            return res
                .status(404)
                .send(
                    "File not found."
                );

        }


        const filePath =
            path.join(
                UPLOAD_DIR,
                file.storageName
            );


        if (
            !fs.existsSync(
                filePath
            )
        ) {

            return res
                .status(404)
                .send(
                    "Stored file not found."
                );

        }


        file.downloads =
            Number(
                file.downloads || 0
            ) + 1;


        writeJSON(
            FILES_DB,
            files
        );


        res.download(
            filePath,
            file.originalName ||
            file.name
        );

    }
);


/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
    "/api/admin/login",
    (req, res) => {

        const password =
            String(
                req.body.password || ""
            );


        if (
            !password ||
            password !==
                ADMIN_PASSWORD
        ) {

            return res
                .status(401)
                .json({

                    success: false,

                    error:
                        "Invalid administrator password."

                });

        }


        const token =
            createSession();


        res.cookie(
            "admin_session",
            token,
            {

                httpOnly: true,

                sameSite: "lax",

                secure:
                    process.env.NODE_ENV ===
                    "production",

                maxAge:
                    24 * 60 * 60 * 1000

            }
        );


        res.json({

            success: true,

            message:
                "Administrator login successful."

        });

    }
);


/* =========================================================
   ADMIN SESSION CHECK
========================================================= */

app.get(
    "/api/admin/me",
    requireAdmin,
    (req, res) => {

        res.json({

            authenticated: true

        });

    }
);


/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post(
    "/api/admin/logout",
    (req, res) => {

        const token =
            req.cookies.admin_session;


        if (token) {

            adminSessions.delete(
                token
            );

        }


        res.clearCookie(
            "admin_session"
        );


        res.json({

            success: true

        });

    }
);


/* =========================================================
   ADMIN GET ALL FILES
========================================================= */

app.get(
    "/api/admin/files",
    requireAdmin,
    (req, res) => {

        const files =
            readJSON(
                FILES_DB,
                DEFAULT_FILES
            );


        res.json({

            files

        });

    }
);


/* =========================================================
   ADMIN UPLOAD
========================================================= */

app.post(
    "/api/admin/upload",
    requireAdmin,
    upload.single("file"),
    (req, res) => {

        if (!req.file) {

            return res
                .status(400)
                .json({

                    error:
                        "No file uploaded."

                });

        }


        const name =
            String(
                req.body.name ||
                req.file.originalname
            )
            .trim();


        const category =
            String(
                req.body.category ||
                "Other"
            )
            .trim();


        const description =
            String(
                req.body.description ||
                ""
            )
            .trim();


        const files =
            readJSON(
                FILES_DB,
                DEFAULT_FILES
            );


        const newFile = {

            id:
                crypto
                    .randomUUID(),

            name,

            originalName:
                req.file.originalname,

            storageName:
                req.file.filename,

            category,

            description,

            size:
                req.file.size,

            mimetype:
                req.file.mimetype,

            downloads:
                0,

            createdAt:
                new Date().toISOString()

        };


        files.unshift(
            newFile
        );


        writeJSON(
            FILES_DB,
            files
        );


        res.status(201).json({

            success: true,

            file:
                newFile

        });

    }
);


/* =========================================================
   ADMIN DELETE FILE
========================================================= */

app.delete(
    "/api/admin/files/:id",
    requireAdmin,
    (req, res) => {

        const files =
            readJSON(
                FILES_DB,
                DEFAULT_FILES
            );


        const index =
            files.findIndex(
                file =>
                    file.id ===
                    req.params.id
            );


        if (index === -1) {

            return res
                .status(404)
                .json({

                    error:
                        "File not found."

                });

        }


        const file =
            files[index];


        const filePath =
            path.join(
                UPLOAD_DIR,
                file.storageName
            );


        if (
            fs.existsSync(
                filePath
            )
        ) {

            fs.unlinkSync(
                filePath
            );

        }


        files.splice(
            index,
            1
        );


        writeJSON(
            FILES_DB,
            files
        );


        res.json({

            success: true,

            message:
                "File deleted successfully."

        });

    }
);


/* =========================================================
   ADMIN UPDATE SETTINGS
========================================================= */

app.put(
    "/api/admin/settings",
    requireAdmin,
    (req, res) => {

        const current =
            readJSON(
                SETTINGS_DB,
                DEFAULT_SETTINGS
            );


        const body =
            req.body || {};


        const music =
            body.music || {};


        const community =
            body.community || {};


        const settings = {

            music: {

                spotify:
                    cleanURL(
                        music.spotify
                    ),

                tidal:
                    cleanURL(
                        music.tidal
                    ),

                amazonMusic:
                    cleanURL(
                        music.amazonMusic
                    ),

                audiomack:
                    cleanURL(
                        music.audiomack
                    ),

                soundcloud:
                    cleanURL(
                        music.soundcloud
                    )

            },

            community: {

                whatsapp:
                    cleanURL(
                        community.whatsapp
                    )

            }

        };


        /*
         * Keep existing values when
         * a field wasn't supplied.
         */

        settings.music.spotify =
            music.spotify !== undefined
                ? settings.music.spotify
                : current.music?.spotify || "";


        settings.music.tidal =
            music.tidal !== undefined
                ? settings.music.tidal
                : current.music?.tidal || "";


        settings.music.amazonMusic =
            music.amazonMusic !== undefined
                ? settings.music.amazonMusic
                : current.music?.amazonMusic || "";


        settings.music.audiomack =
            music.audiomack !== undefined
                ? settings.music.audiomack
                : current.music?.audiomack || "";


        settings.music.soundcloud =
            music.soundcloud !== undefined
                ? settings.music.soundcloud
                : current.music?.soundcloud || "";


        settings.community.whatsapp =
            community.whatsapp !== undefined
                ? settings.community.whatsapp
                : current.community?.whatsapp || "";


        writeJSON(
            SETTINGS_DB,
            settings
        );


        res.json({

            success: true,

            settings

        });

    }
);


/* =========================================================
   ADMIN STATS
========================================================= */

app.get(
    "/api/admin/stats",
    requireAdmin,
    (req, res) => {

        const files =
            readJSON(
                FILES_DB,
                DEFAULT_FILES
            );


        const totalDownloads =
            files.reduce(
                (
                    total,
                    file
                ) => {

                    return total +
                        Number(
                            file.downloads ||
                            0
                        );

                },
                0
            );


        res.json({

            files:
                files.length,

            downloads:
                totalDownloads

        });

    }
);


/* =========================================================
   FILE VALIDATION HELPERS
========================================================= */

function publicFile(
    file
) {

    return {

        id:
            file.id,

        name:
            file.name,

        originalName:
            file.originalName,

        category:
            file.category,

        description:
            file.description,

        size:
            file.size,

        mimetype:
            file.mimetype,

        downloads:
            file.downloads || 0,

        createdAt:
            file.createdAt

    };

}


function cleanURL(
    value
) {

    const url =
        String(
            value || ""
        )
        .trim();


    if (!url) {

        return "";

    }


    try {

        const parsed =
            new URL(
                url
            );


        return parsed.href
            .replace(
                /\/$/,
                ""
            );

    } catch (error) {

        return url
            .replace(
                /\/$/,
                ""
            );

    }

}


/* =========================================
   PARTICLE BACKGROUND
   ========================================= */

const canvas =
    document.getElementById(
        "particleCanvas"
    );

const ctx =
    canvas.getContext(
        "2d"
    );

let particles = [];

let particleCount =
    window.innerWidth < 600
        ? 45
        : 80;


function resizeCanvas() {

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

}


resizeCanvas();


window.addEventListener(
    "resize",
    () => {

        resizeCanvas();

        particleCount =
            window.innerWidth < 600
                ? 45
                : 80;

        createParticles();

    }
);


function createParticles() {

    particles = [];

    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        particles.push({

            x:
                Math.random() *
                canvas.width,

            y:
                Math.random() *
                canvas.height,

            size:
                Math.random() *
                2.5 +
                0.5,

            speedX:
                (Math.random() - 0.5) *
                0.6,

            speedY:
                (Math.random() - 0.5) *
                0.6,

            opacity:
                Math.random() *
                0.6 +
                0.2

        });

    }

}


function drawParticles() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    particles.forEach(
        particle => {

            particle.x +=
                particle.speedX;

            particle.y +=
                particle.speedY;


            if (
                particle.x < 0 ||
                particle.x > canvas.width
            ) {

                particle.speedX *= -1;

            }


            if (
                particle.y < 0 ||
                particle.y > canvas.height
            ) {

                particle.speedY *= -1;

            }


            ctx.beginPath();


            ctx.arc(
                particle.x,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                `rgba(255, 50, 50, ${particle.opacity})`;


            ctx.fill();

        }
    );


    requestAnimationFrame(
        drawParticles
    );

}


createParticles();

drawParticles();


/* =========================================
   CONNECTION LINES
   ========================================= */

function drawConnections() {

    for (
        let i = 0;
        i < particles.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < particles.length;
            j++
        ) {

            const p1 =
                particles[i];

            const p2 =
                particles[j];


            const dx =
                p1.x -
                p2.x;

            const dy =
                p1.y -
                p2.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <
                120
            ) {

                const opacity =
                    1 -
                    distance / 120;


                ctx.beginPath();


                ctx.moveTo(
                    p1.x,
                    p1.y
                );


                ctx.lineTo(
                    p2.x,
                    p2.y
                );


                ctx.strokeStyle =
                    `rgba(255, 50, 50, ${opacity * 0.18})`;


                ctx.lineWidth =
                    0.6;


                ctx.stroke();

            }

        }

    }

}


function particleLoop() {

    drawConnections();

    requestAnimationFrame(
        particleLoop
    );

}


particleLoop();


/* =========================================
   GLOBAL HELPERS
   ========================================= */

function $(selector) {

    return document.querySelector(
        selector
    );

}


function $$(selector) {

    return document.querySelectorAll(
        selector
    );

}


function showElement(
    element
) {

    if (!element) {

        return;

    }

    element.style.display =
        "";

}


function hideElement(
    element
) {

    if (!element) {

        return;

    }

    element.style.display =
        "none";

}


/* =========================================
   MOBILE MENU
   ========================================= */

const menuButton =
    $("#menuButton");

const mobileMenu =
    $("#mobileMenu");


if (
    menuButton &&
    mobileMenu
) {

    menuButton.addEventListener(
        "click",
        () => {

            mobileMenu.classList.toggle(
                "active"
            );

        }
    );


    $$("#mobileMenu a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileMenu.classList.remove(
                            "active"
                        );

                    }
                );

            }
        );

}


/* =========================================
   SMOOTH SCROLL
   ========================================= */

$$(
    'a[href^="#"]'
).forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                const target =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !target ||
                    target === "#"
                ) {

                    return;

                }


                const element =
                    document.querySelector(
                        target
                    );


                if (!element) {

                    return;

                }


                event.preventDefault();


                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }
);


/* =========================================
   BACK TO TOP
   ========================================= */

const backTop =
    $("#backTop");


if (backTop) {

    window.addEventListener(
        "scroll",
        () => {

            if (
                window.scrollY >
                500
            ) {

                backTop.classList.add(
                    "show"
                );

            } else {

                backTop.classList.remove(
                    "show"
                );

            }

        }
    );


    backTop.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* =========================================
   COPY TO CLIPBOARD
   ========================================= */

async function copyText(
    text
) {

    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Copied to clipboard"
        );

        return true;

    } catch (error) {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();

        showToast(
            "Copied to clipboard"
        );

        return true;

    }

}


/* =========================================
   TOAST
   ========================================= */

function showToast(
    message,
    duration = 2500
) {

    let toast =
        $("#toast");


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "toast";

        toast.className =
            "toast";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            duration
        );

}


/* =========================================
   MODAL
   ========================================= */

function openModal(
    modal
) {

    if (!modal) {

        return;

    }


    modal.classList.add(
        "active"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(
    modal
) {

    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


$$(
    "[data-close-modal]"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const modal =
                    button.closest(
                        ".modal"
                    );

                closeModal(
                    modal
                );

            }
        );

    }
);


$$(
    ".modal"
).forEach(
    modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeModal(
                        modal
                    );

                }

            }
        );

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            $$(".modal.active")
                .forEach(
                    modal => {

                        closeModal(
                            modal
                        );

                    }
                );

        }

    }
);


/* =========================================
   FILE INPUT PREVIEW
   ========================================= */

$$(
    'input[type="file"]'
).forEach(
    input => {

        input.addEventListener(
            "change",
            () => {

                const files =
                    input.files;


                if (
                    !files ||
                    !files.length
                ) {

                    return;

                }


                const label =
                    input.closest(
                        ".file-upload"
                    )?.querySelector(
                        ".file-name"
                    );


                if (label) {

                    if (
                        files.length ===
                        1
                    ) {

                        label.textContent =
                            files[0].name;

                    } else {

                        label.textContent =
                            `${files.length} files selected`;

                    }

                }

            }
        );

    }
);


/* =========================================
   SEARCH
   ========================================= */

const searchInput =
    $("#searchInput");


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .toLowerCase()
                    .trim();


            $$(".searchable")
                .forEach(
                    item => {

                        const text =
                            item.textContent
                                .toLowerCase();


                        if (
                            !query ||
                            text.includes(
                                query
                            )
                        ) {

                            item.style.display =
                                "";

                        } else {

                            item.style.display =
                                "none";

                        }

                    }
                );

        }
    );

}


/* =========================================
   COPY BUTTONS
   ========================================= */

$$(
    "[data-copy]"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const value =
                    button.getAttribute(
                        "data-copy"
                    );


                if (value) {

                    copyText(
                        value
                    );

                }

            }
        );

    }
);


/* =========================================
   DOWNLOAD BUTTONS
   ========================================= */

$$(
    "[data-download]"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const url =
                    button.getAttribute(
                        "data-download"
                    );


                if (!url) {

                    return;

                }


                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    url;

                link.download =
                    "";


                document.body.appendChild(
                    link
                );


                link.click();

                link.remove();

            }
        );

    }
);


/* =========================================
   URL VALIDATION
   ========================================= */

function isValidURL(
    value
) {

    try {

        const url =
            new URL(
                value
            );


        return (
            url.protocol ===
                "http:" ||
            url.protocol ===
                "https:"
        );

    } catch (error) {

        return false;

    }

}


/* =========================================
   STATUS MESSAGE
   ========================================= */

function setStatus(
    element,
    message,
    type = "info"
) {

    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.classList.remove(
        "success",
        "error",
        "warning",
        "info"
    );


    element.classList.add(
        type
    );

}


/* =========================================
   LOADING STATE
   ========================================= */

function setLoading(
    button,
    loading = true
) {

    if (!button) {

        return;

    }


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled =
            true;

        button.innerHTML =
            '<span class="spinner"></span> Processing...';

    } else {

        button.disabled =
            false;

        if (
            button.dataset.originalText
        ) {

            button.innerHTML =
                button.dataset.originalText;

        }

    }

}


/* =========================================
   INITIALIZE
   ========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document.body.classList.add(
            "page-ready"
        );


        console.log(
            "Address XSX initialized."
        );

    }
);
