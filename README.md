🌍 WORLD CLUTRA888

«Files • Music • Community»

WORLD CLUTRA888 is a web platform built for sharing configuration files, discovering digital resources, and promoting music and community links from one place.

🚀 Features

- 📁 Configuration file library
- 📤 Admin file uploads
- 🗑️ Admin file management
- 📊 Download tracking
- 🔐 Protected admin dashboard
- 🎵 Spotify integration
- 🌊 TIDAL integration
- 🎧 Amazon Music integration
- 🎶 Audiomack integration
- ☁️ SoundCloud integration
- 💬 WhatsApp community link
- 📱 Mobile-friendly interface
- ⚡ Node.js + Express backend
- 💾 Persistent file storage on Render
- 🔄 API-powered frontend/backend

📂 Supported File Categories

The platform can organize files into categories such as:

- SH Tunnel
- Dark Tunnel
- HTTP Injector
- HTTP Custom
- Other

«Only upload files that you are legally permitted to distribute and that comply with the relevant service's rules.»

🛠️ Technology

HTML
CSS
JavaScript
Node.js
Express
Multer
Render

📁 Project Structure

WORLD-CLUTRA888/
│
├── render.yaml
├── package.json
├── server.js
├── .env.example
├── .gitignore
│
├── data/
│   ├── files.json
│   └── settings.json
│
├── storage/
│   └── uploads/
│       └── .gitkeep
│
└── public/
    ├── index.html
    └── admin.html

⚙️ Local Setup

Clone the repository:

git clone YOUR_REPOSITORY_URL
cd WORLD-CLUTRA888

Install dependencies:

npm install

Set the administrator password:

ADMIN_PASSWORD=your_secure_password

Start the server:

npm start

The website will run on:

http://localhost:3000

Admin dashboard:

http://localhost:3000/admin.html

🔐 Environment Variables

The application uses:

PORT
ADMIN_PASSWORD

Example:

PORT=3000
ADMIN_PASSWORD=your_secure_password

Never commit your real ".env" file or administrator password to GitHub.

☁️ Render Deployment

The project includes:

render.yaml

for Render deployment.

The application starts with:

npm start

Uploaded files are stored inside:

storage/uploads/

The Render persistent disk should be mounted to:

/opt/render/project/src/storage

This keeps uploaded files available across deployments and service restarts.

🔑 Admin Dashboard

Open:

/admin.html

The administrator can:

1. Log in
2. Upload files
3. Select a category
4. Add descriptions
5. View uploaded files
6. Track downloads
7. Delete files
8. Update music links
9. Update the WhatsApp community link
10. Log out

🎵 Music Promotion

WORLD CLUTRA888 can display links to:

Spotify
TIDAL
Amazon Music
Audiomack
SoundCloud

Links can be updated through the administrator dashboard instead of changing the source code manually.

🔌 API

Health

GET /api/health

Get files

GET /api/files

Search files

GET /api/files?search=example

Filter category

GET /api/files?category=SH%20Tunnel

Download

GET /api/download/:id

Public settings

GET /api/settings

Admin login

POST /api/admin/login

Upload

POST /api/admin/upload

Delete

DELETE /api/admin/files/:id

Update settings

PUT /api/admin/settings

🛡️ Security

The administrator API is protected by authentication.

The project also:

- Uses HTTP-only session cookies
- Validates administrator access
- Limits uploads to 25 MB
- Validates external HTTP/HTTPS links
- Prevents direct exposure of the admin password
- Keeps environment secrets outside the source code

For production, use a strong administrator password and HTTPS.

📱 Mobile First

WORLD CLUTRA888 is designed to work on:

- Android
- iPhone
- Tablets
- Desktop browsers

The interface is responsive so the platform can be managed from a phone as well.

🎯 Project Goal

WORLD CLUTRA888 brings together:

FILES + MUSIC + COMMUNITY

into one platform.

The project is designed to grow with additional categories, APIs, user features, music promotion tools, and community functionality.

---

WORLD CLUTRA888

Built to share. Built to connect. Built to grow.

"© WORLD CLUTRA888"