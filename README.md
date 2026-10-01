# InstaPilot AI

An AI-powered Instagram advertising dashboard. Connect your Instagram account, add your products, and let AI generate and launch optimized Instagram ad campaigns through the official Meta Marketing API.

## Features
- **Instagram Ads Only**: Focused specifically on Instagram ad campaigns.
- **AI Campaign Planning**: Automatically generates target audiences, ad copy, creative concepts, and campaign settings using OpenAI.
- **Meta Integration**: Uses the official Meta OAuth flow to securely connect Instagram business accounts.
- **Security First**: 
  - Never asks for or stores Facebook/Instagram passwords.
  - OAuth tokens are encrypted at rest using Fernet symmetric encryption.
  - JWT-based authentication.
- **Demo Mode**: Can be run without Meta credentials for testing and demonstration.
- **Mobile Responsive**: Designed mobile-first for easy access from any device.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, SQLite (PostgreSQL-ready)
- **AI**: OpenAI GPT-4o-mini
- **Integration**: Meta Marketing API

---

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- A Meta Developer account (for live Instagram integration)
- An OpenAI API key (for AI planning)

---

## Meta Developer Setup (Required for real campaigns)

To launch real campaigns on Instagram, you must create a Meta App and configure its credentials.

### 1. Create a Meta App
1. Go to the [Meta for Developers Dashboard](https://developers.facebook.com/apps/).
2. Click **Create App**.
3. Select **Other** > **Next**.
4. Select **Business** > **Next**.
5. Give your app a name (e.g., "InstaPilot") and add your contact email. Click **Create app**.

### 2. Configure Meta App Credentials
1. In the App Dashboard, go to **App Settings** > **Basic** in the left sidebar.
2. Note your **App ID** — this is your `META_APP_ID`.
3. Click **Show** next to **App Secret** — this is your `META_APP_SECRET`.

### 3. Configure OAuth Redirect URI
1. In the left sidebar, click **Add Product** and set up **Facebook Login for Business**.
2. Go to **Facebook Login for Business** > **Settings**.
3. Under **Valid OAuth Redirect URIs**, you must add your callback URL.
   - *Note for Local Development*: Meta requires this to be a valid, accessible HTTPS URL. You cannot use `localhost` or a local IP for the redirect URI in most cases, though sometimes `http://localhost:8000/integrations/instagram/callback` is accepted for development.
   - *Recommended for Local*: Use [ngrok](https://ngrok.com/) to tunnel your local backend port: `ngrok http 8000`. Then use the ngrok URL: `https://<YOUR_NGROK_ID>.ngrok.app/integrations/instagram/callback`.
4. Save Changes.

### 4. Required Permissions
Your app needs the following permissions to manage ads and Instagram accounts:
- `ads_management`
- `ads_read`
- `instagram_business_basic`  *(replaces deprecated `instagram_basic` — required for Meta Business Login)*
- `pages_show_list`
- `business_management`

*Note: For development, as long as you log in with the Facebook account that created the Meta App, you have these permissions automatically. For production with other users, you must submit your app for **App Review**.*

### 5. Development Ad Account
1. You need a Meta Business account and an associated Ad Account.
2. Ensure your Instagram account is a Professional/Business account and linked to a Facebook Page you manage.

---

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Edit `backend/.env` with your credentials:
- `SECRET_KEY`: Generate a long random string.
- `META_APP_ID` & `META_APP_SECRET`: From your Meta App.
- `META_REDIRECT_URI`: Make sure this matches what you put in the Meta App settings.
- `OPENAI_API_KEY`: Your OpenAI key.

Start the backend:
```bash
# This binds to 0.0.0.0 allowing LAN access
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```
Edit `frontend/.env`:
- `VITE_API_URL`: Point this to your backend. If testing on mobile, use your computer's LAN IP (e.g., `http://192.168.1.100:8000`).

Start the frontend:
```bash
# Vite is configured to bind to host: true in vite.config.js for LAN access
npm run dev
```

---

## Testing on Mobile

1. Connect your phone to the same Wi-Fi network as your computer.
2. Find your computer's local IP address (e.g., `192.168.1.100`).
3. Update `frontend/.env`: `VITE_API_URL=http://192.168.1.100:8000`
4. Update `backend/.env`: `FRONTEND_URL=http://192.168.1.100:5173`
5. Restart both servers.
6. Open your mobile browser and navigate to `http://192.168.1.100:5173`.

---

## Demo / Mock Mode

If you want to test the application without a Meta Developer account or OpenAI key:
1. Leave `META_APP_ID`, `META_APP_SECRET`, and `OPENAI_API_KEY` empty in your `.env`.
2. The application will automatically enter Demo Mode.
3. It will generate mock AI responses and simulate campaign launches with `DEMO_` prefixed IDs. No real ad campaigns will be created.
