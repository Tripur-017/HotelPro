# HotelPro — Hotel Booking and Management System

A beginner-friendly MERN capstone MVP using React + Vite, Express, MongoDB/Mongoose, JWT, and bcryptjs.

## Implemented in this starter
- Public homepage and room listing
- Customer registration/login/logout
- Hashed passwords and JWT authentication
- Customer booking creation, history, and cancellation
- Server-side date validation and overlapping-booking checks
- Admin-only room creation/deactivation, booking list, and user list
- Idempotent sample-room seed script and environment-configured admin creation
- Health-check endpoint

## Important limitations
- Payments are **not implemented**. Booking confirmation is not a real payment.
- Email, image uploads, reviews, housekeeping, and staff modules are not implemented.
- This is a local capstone MVP, not a production-ready hotel/payment system.
- JWT is stored in localStorage for simplicity of this demo. For production, consider secure httpOnly cookies and additional protections.

## Requirements
- Node.js LTS (Node 20+ recommended) and npm
- MongoDB Atlas account or a local MongoDB server
- VS Code and a modern browser

## 1. Configure the backend
Open a terminal in the `server` folder:

```powershell
Copy-Item .env.example .env
npm install
```

Edit `server/.env` and set:
- `MONGODB_URI`: your MongoDB connection string
- `JWT_SECRET`: a long random secret
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: initial admin account values

For MongoDB Atlas:
1. Create a free cluster and a database user.
2. In Network Access, allow your current IP address (avoid `0.0.0.0/0` except temporarily for troubleshooting).
3. Copy the Node.js connection string and replace the placeholder credentials/database name.
4. Never commit `.env` or share its credentials publicly.

Seed sample rooms and create the initial admin (safe to run more than once):

```powershell
npm run seed
npm run create-admin
```

Start the API:

```powershell
npm run dev
```

Expected startup message includes `MongoDB connected` and `HotelPro API running on port 5000`.
Check `http://localhost:5000/api/health` in your browser.

## 2. Configure the frontend
Open a second terminal in the `client` folder:

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The frontend uses `http://localhost:5000/api` by default. If needed, create `client/.env` with:
`VITE_API_URL=http://localhost:5000/api`

## 3. Demo workflow
1. Register a customer account.
2. Browse rooms, choose check-in/check-out dates, and book.
3. Open My Bookings to see/cancel an eligible booking.
4. Log in with the admin credentials from `server/.env`.
5. Use Admin Dashboard to add/deactivate rooms and review bookings/users.

## API endpoints
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/rooms`
- `POST /api/rooms` (admin)
- `PATCH /api/rooms/:id/deactivate` (admin)
- `POST /api/bookings` (customer)
- `GET /api/bookings/my` (customer)
- `PATCH /api/bookings/:id/cancel` (owner or admin)
- `GET /api/admin/bookings` (admin)
- `GET /api/admin/users` (admin)

## Testing checklist
- Register with valid details; confirm duplicate email is rejected.
- Login with wrong password; confirm it is rejected.
- Try `/api/admin/bookings` without a token; confirm access is denied.
- Create a booking with checkout before check-in; confirm validation error.
- Book the same room for overlapping dates from another account; confirm conflict is rejected.
- Confirm booking history only shows the signed-in user's bookings.
- Create/deactivate a room as admin.
- Restart the server and confirm room/booking data persists in MongoDB.

## Submission checklist
- Add screenshots of the real running application.
- Record a demo video showing the implemented flows.
- Fill in your assigned documentation template using only features actually implemented.
- Push source to your own GitHub repository; never commit `.env`.
