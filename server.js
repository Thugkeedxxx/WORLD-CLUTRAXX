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

        if (!fs.existsSync(file)) {

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
   URL CLEANER
========================================================= */

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
            new URL(url);

        if (
            parsed.protocol !== "http:" &&
            parsed.protocol !== "https:"
        ) {

            return "";

        }

        return parsed.toString();

    } catch {

        return "";

    }

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

app.disable(
    "x-powered-by"
);

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

const PUBLIC_DIR =
    path.join(
        ROOT_DIR,
        "public"
    );

if (
    fs.existsSync(
        PUBLIC_DIR
    )
) {

    app.use(
        express.static(
            PUBLIC_DIR
        )
    );

}


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
   ADMIN SESSIONS
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
