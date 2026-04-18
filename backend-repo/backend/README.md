## Backend (FastAPI + Supabase)

### What this provides
- **Auth**: Supabase Auth (`/signup`, `/login`)
- **JWT verification**: backend verifies Supabase JWT and attaches user to request
- **Protected APIs**: `/me`, `/create-booking`, `/review`
- **Public APIs**: `/workers` (public read via RLS), `/` healthcheck

### Setup
Create `backend/.env` (copy from `.env.example`) and fill:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- (recommended) `SUPABASE_ANON_KEY` (so user-scoped queries enforce RLS properly)

Create venv + install:
```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Run the API:
```bash
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Open docs at `http://127.0.0.1:8000/docs`.

### Postman testing guide

#### 1) Signup
- **Method**: POST
- **URL**: `http://127.0.0.1:8000/signup`
- **Body (JSON)**:
```json
{ "email": "user1@example.com", "password": "password123", "name": "User One" }
```
Expected: Supabase response (may require email confirmation depending on your Supabase Auth settings).

#### 2) Login (get JWT)
- **Method**: POST
- **URL**: `http://127.0.0.1:8000/login`
- **Body (JSON)**:
```json
{ "email": "user1@example.com", "password": "password123" }
```
Copy the **access token** from the response (typically `session.access_token`).

#### 3) Call protected routes (pass JWT)
For protected routes, add a header:
- **Key**: `Authorization`
- **Value**: `Bearer <ACCESS_TOKEN>`

Test:

- **GET** `http://127.0.0.1:8000/me`
  - Returns the current user's `public.users` profile row (RLS ensures it's “self only”).

#### 4) List workers (public)
- **GET** `http://127.0.0.1:8000/workers`
  - No auth required.

#### 5) Create booking (protected)
You need a valid `worker_id` (UUID) from `/workers`.
- **POST** `http://127.0.0.1:8000/create-booking`
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Body (JSON)**:
```json
{ "worker_id": "00000000-0000-0000-0000-000000000000", "price": 499 }
```
Expected: new booking row with `status: "pending"`.

#### 6) Add review (protected)
Use a `booking_id` you created.
- **POST** `http://127.0.0.1:8000/review`
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Body (JSON)**:
```json
{ "booking_id": "00000000-0000-0000-0000-000000000000", "rating": 5, "comment": "Great service!" }
```

