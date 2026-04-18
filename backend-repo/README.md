# AI-Powered-Local-Services-Supply-Platform

## Backend API Server

The backend server lives in `backend-repo/server`.

### Setup

```powershell
cd "C:\Users\Kushal\Downloads\MANJU-FRONTEND\backend-repo\server"
npm install
copy .env.example .env
```

### Run

```powershell
npm start
```

The server starts at `http://localhost:5000`.

### Notes

- `HUGGING_FACE_API_KEY` is optional. Without it, AI endpoints fall back to keyword-based classification.
- Use the root workspace frontend with `npm run frontend` or `python -m http.server` from the project root.
