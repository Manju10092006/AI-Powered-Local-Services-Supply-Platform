# FixMate — Home Services Platform

This workspace contains a static frontend and a Node backend server for the FixMate platform.

## What is included

- `index.html`, `landing.html`, `login.html`, `register.html`, and customer/admin/worker pages at the root level
- Frontend assets in `assets/`
- Backend API server in `backend-repo/server`

## Recommended setup

### 1. Install frontend helper tools
From the workspace root:

```powershell
cd "C:\Users\Kushal\Downloads\MANJU-FRONTEND"
npm install
```

### 2. Install backend dependencies

```powershell
cd "C:\Users\Kushal\Downloads\MANJU-FRONTEND\backend-repo\server"
npm install
copy .env.example .env
```

(Optional) update `backend-repo/server/.env` with `HUGGING_FACE_API_KEY` if you want AI inference against Hugging Face.

### 3. Run the backend server

```powershell
cd "C:\Users\Kushal\Downloads\MANJU-FRONTEND\backend-repo\server"
npm start
```

The backend will run at `http://localhost:5000`.

### 4. Run the frontend locally

From the workspace root:

```powershell
npm run frontend
```

Then open the URL shown in the terminal, typically:

- `http://localhost:3000/index.html`

If port `3000` is already in use, `serve` will automatically choose the next available port.

### 5. Run frontend + backend together

From the workspace root:

```powershell
npm run dev
```

This launches the frontend on port `3000` and the backend on port `5000`.

## Notes

- The root frontend uses HTTP fetch calls and must be served over a local web server to work properly.
- If you prefer not to use `npm` for frontend serving, you can also run:

```powershell
cd "C:\Users\Kushal\Downloads\MANJU-FRONTEND"
python -m http.server 3000
```

- If you see `Failed to fetch` in the browser, make sure the backend is running at `http://localhost:5000`.
