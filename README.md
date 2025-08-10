# Saraha Backend API

A Node.js backend REST API for user authentication, profile management, and email verification, built with Express, MongoDB, and JWT.

## Features

- User registration with email confirmation (OTP)
- Login with password and social login (Google OAuth)
- Password reset via OTP email
- JWT access and refresh token authentication
- User profile retrieval and update
- Encrypted sensitive data (phone number)
- Validation with Joi schemas
- Centralized error and success handling
- Email notifications via Nodemailer and event-driven OTP system

## Technologies

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (jsonwebtoken)
- Bcrypt for password hashing
- CryptoJS for AES encryption
- Joi for request validation
- Nodemailer for sending emails
- Google OAuth client
- dotenv for environment variables

## Getting Started

### Prerequisites

- Node.js >= 16.x
- MongoDB instance (local or cloud)
- Gmail account for sending emails (or modify for other providers)
- Google OAuth Client ID for social login

### Installation

1. Clone the repo

```bash
git clone https://github.com/yourusername/saraha-backend.git
cd saraha-backend
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file inside `/src/config/` and add the following variables:

```env
PORT=5000
URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password-or-app-password
USER_ACCESS_SIGNITUER=yourUserAccessSecret
USER_REFRESH_SIGNITUER=yourUserRefreshSecret
ADMIN_ACCESS_SIGNITUER=yourAdminAccessSecret
ADMIN_REFRESH_SIGNITUER=yourAdminRefreshSecret
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
SALT=10
ENCRYPTION_KEY=32-character-random-string-for-AES
OTP_ALPHABET=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
OTP_SIZE=6
CLIENT_ID=your-google-oauth-client-id
EXPIRATION=600000
NODE_ENV=development
```

4. Run the server

```bash
npm start
```

The server should now be running on `http://localhost:5000`

## API Endpoints

### Auth Module

| Endpoint                  | Method | Description                   | Validation           |
|---------------------------|--------|-------------------------------|----------------------|
| `/auth/signup`            | POST   | Register new user             | SignupSchema         |
| `/auth/login`             | POST   | Login with email & password   | LoginSchema          |
| `/auth/social-login`      | POST   | Google OAuth login            | -                    |
| `/auth/confirm_email`     | PATCH  | Confirm email with OTP        | ConfirmEmailSchema   |
| `/auth/forget_password`   | PATCH  | Request password reset OTP    | ForgetPasswordSchema |
| `/auth/change_password`   | PATCH  | Change password with OTP      | ChangePasswordSchema |
| `/auth/refresh`           | PATCH  | Refresh access token          | -                    |
| `/auth/resend-password-code` | PATCH | Resend password OTP         | ResendOtpSchema      |
| `/auth/resend-confirm-code`  | PATCH | Resend email confirmation OTP| ResendOtpSchema      |

### User Module

| Endpoint                 | Method | Description                      | Auth Required | Validation          |
|--------------------------|--------|---------------------------------|---------------|---------------------|
| `/user/share-profile`    | GET    | Get shareable user profile link | Yes           | -                   |
| `/user/user-profile/:id` | GET    | Get public user profile          | No            | -                   |
| `/user/update`           | PATCH  | Update user profile (name, phone) | Yes         | UpdateProfileSchema  |

## Folder Structure

```
Saraha-App/
├── src/
│   ├── DB/
│   │   ├── Models/
│   │   │   └── userModel.js
│   │   └── DBservices.js
│   │   └── connection.js
│   │ 
│   ├── Middelware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ...
│   │
│   ├── Modules/
│   │   ├── authModule/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.services.js
│   │   │   ├── auth.validation.js
│   │   │   └── ...
│   │   ├── userModule/
│   │   │   ├── user.controller.js
│   │   │   ├── user.services.js
│   │   │   ├── user.validation.js
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── Utils/
│   │   ├── ConfirmEmail/
│   │   │   ├── emailEmitter.js
│   │   │   ├── sendEmail.js
│   │   │   └── generateHTML
│   │   ├── bcrypt.js
│   │   ├── crypto.js
│   │   ├── errors.js
│   │   └── successHandler.js
│   │
│   ├── config/
│   │   └── .env
│   │
│   └── app.controller.js
│
├── index.js
```

## Notes

- Keep environment variables secret and never commit `.env` files.
- Use strong secrets for JWT and AES encryption keys.
- Use Google OAuth credentials for social login.
- Email service uses Gmail SMTP by default; modify `sendEmail.js` if needed.
- Validation schemas enforce input integrity and reduce invalid data persistence.

## License

MIT License
