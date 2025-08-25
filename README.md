# Saraha (WhisperApp) Backend API

A Node.js REST API for anonymous messaging, user authentication, profile management, image uploads, and email verification.

- Tech: `Node.js` + `Express` + `MongoDB/Mongoose`
- Auth: `JWT` access/refresh tokens, Google OAuth login
- Uploads: Local static hosting + Cloudinary
- Validation: `Joi`
- Emails: `Nodemailer` + event-driven OTP

## Features

- **Auth**: Sign up with email OTP confirmation, system login, Google social login, refresh token, logout, update email with dual OTP, update password, forgot/change password with OTP and request limits.
- **Profiles**: Share profile link, get public profile, update profile (name/phone), activate/deactivate/delete account.
- **Images**: Local profile image upload, Cloudinary profile and cover images.
- **Messages**: Anonymous messages with optional images to a user’s profile.
- **Security**: Bcrypt password hashing, AES encryption for phone, JWT revoke list, role-based access, throttling/ban windows for OTP and resend requests.

## Project Structure

```
WhisperApp/
├── index.js
├── src/
│   ├── app.controller.js
│   ├── config/.env
│   ├── DB/
│   │   ├── connection.js
│   │   ├── DBservices.js
│   │   └── Models/
│   │       ├── userModel.js
│   │       ├── message.model.js
│   │       └── revokedToken.model.js
│   ├── Middelware/
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── Modules/
│   │   ├── authModule/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.services.js
│   │   │   └── auth.validation.js
│   │   ├── userModule/
│   │   │   ├── user.controller.js
│   │   │   ├── user.services.js
│   │   │   └── user.validation.js
│   │   └── messageModule/
│   │       ├── message.controller.js
│   │       ├── message.services.js
│   │       └── message.validation.js
│   └── Utils/
│       ├── bcrypt.js
│       ├── crypto.js
│       ├── errors.js
│       ├── successHandler.js
│       ├── SendEmails/
│       │   ├── emailEmitter.js
│       │   ├── generateHTML.js
│       │   └── sendEmail.js
│       └── multer/
│           ├── multer.js
│           ├── multer cloud.js
│           ├── cloudinaryConfig.js
│           └── cloudinary.services.js
```

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB (local or Atlas)
- Cloudinary account (for cloud uploads)
- Gmail account/app password (or adjust SMTP)
- Google OAuth Client ID (for social login)

### Install

```bash
npm install
```

### Environment Variables

Create `src/config/.env` with the following keys (exact names used by the code):

```env
# Server
PORT=3000
URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>

# JWT (note: tokens are returned prefixed with the role)
USER_ACCESS_SIGNITUER=...
USER_REFRESH_SIGNITUER=...
ADMIN_ACCESS_SIGNITUER=...
ADMIN_REFRESH_SIGNITUER=...
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# Password hashing & encryption
SALT=10
ENCRYPTION_KEY=32-characters-random-string

# OTP & ban windows
OTP_ALPAHBET=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ  # (spelled as in code)
OTP_SIZE=6
OTP_EXPIRATION=300000           # ms
BAN_EXPIRATION=900000           # ms

# Google OAuth
CLIENT_ID=<google-oauth-client-id>

# Email (Gmail SMTP by default)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Run

```bash
npm run start:dev
```

Server runs on `http://localhost:${PORT}`.

- Static files served from `./src/uploads` at `/src/uploads`.
- DB connection uses `URI` from `.env` in `src/DB/connection.js`.

## Authentication

- Login/refresh return tokens prefixed with the user role, e.g. `"user <jwt>"` or `"admin <jwt>"` from `auth.services.js`.
- You must send the `authorization` header with the same prefix format expected by `auth.middleware.js`:

```http
authorization: user <jwt>
```

## API Overview

Base paths are registered in `src/app.controller.js`:

- Auth: `/auth`
- Users: `/user`
- Messages (nested under user profile): `/user/user-profile/:id/messages`

### Auth

Routes from `src/Modules/authModule/auth.controller.js`:

- POST `/auth/signup`
- POST `/auth/login`
- POST `/auth/social-login`
- POST `/auth/logout` (requires auth)
- PATCH `/auth/refresh`
- PATCH `/auth/confirm_email`
- PATCH `/auth/forget_password`
- PATCH `/auth/change_password`
- PATCH `/auth/resend-password-code`
- PATCH `/auth/resend-email-confirm-code`
- PATCH `/auth/update-email` (requires auth)
- PATCH `/auth/confirm-new-email` (requires auth)
- PATCH `/auth/resend-new-email-confirm-code` (requires auth)
- PATCH `/auth/update-password` (requires auth)

Validation schemas are in `auth.validation.js`. OTP attempts/request limits and ban windows are enforced in `auth.middleware.js` and `auth.services.js`.

### Users

Routes from `src/Modules/userModule/user.controller.js`:

- GET `/user/share-profile` (auth)
- GET `/user/user-profile/:id`
- PATCH `/user/update` (auth)
- PATCH `/user/deactivate/:id` (auth)
- PATCH `/user/activate/:id` (auth(false) – can activate self or by admin)
- PATCH `/user/local-upload-profile-image` (auth, field: `image`)
- PATCH `/user/cloud-upload-profile-image` (auth, field: `image`)
- PATCH `/user/cloud-upload-cover-images` (auth, field: `images[]`, max 5)
- DELETE `/user/delete/:id` (auth + `allowTo(admin)`)

Local uploads are exposed under `/src/uploads`. Cloud uploads go to Cloudinary under `users/<userId>/...`.

### Messages

Mounted under a user profile via `router.use("/user-profile/:id/messages", ...)`:

- GET `/user/user-profile/:id/messages/` — Get recipient’s messages
- POST `/user/user-profile/:id/messages/send-message` — Send a message (optional images)
  - Form fields: `body` (string, optional if images provided), `from` (optional sender userId), `to` (required recipient userId)
  - Images: field `images` (array, max 5) uploaded to `messages/<recipientId>` in Cloudinary

## Error/Success Format

- Central error handler in `src/app.controller.js` returns `{ message, cause, stack }`.
- `successHandler` returns `{ data, status }` with appropriate HTTP code.
- Common errors defined in `src/Utils/errors.js`.

## Notes

- Keep `src/config/.env` out of VCS. Use strong secrets and separate per environment.
- Use Google OAuth `CLIENT_ID` for `/auth/social-login`.
- For Gmail, prefer an App Password.
- Role-prefixed JWTs are required in the `authorization` header.

## License

MIT
