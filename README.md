# Saraha Backend API

A Node.js backend REST API for anonymous messaging, user authentication, profile management, and email verification, built with Express, MongoDB, and JWT.

## Features

- User registration with email confirmation (OTP).
- Login with password and social login (Google OAuth).
- Password reset via OTP email.
- JWT access and refresh token authentication.
- User Profile Management – Share Profile, Update Account Details, and upload profile image.
- Profile Image Upload with Multer and user-specific folder structure.
- Encrypted Sensitive Data (e.g., phone number with AES encryption).
- Validation with Joi schemas.
- Centralized error and success handling.
- Email notifications via Nodemailer and event-driven OTP system.
- Static File Hosting for uploaded images.

## Technologies

- Backend: Node.js, Express.js
- Database: MongoDB & Mongoose
- Authentication: JWT (jsonwebtoken), Google OAuth
- Security: Bcrypt (password hashing), CryptoJS (AES encryption)
- Validation: Joi
- File Uploads: Multer
- Email Service: Nodemailer (Gmail SMTP by default)
- Environment Config: dotenv

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
PORT=anyPortNumber
URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password-or-app-password
USER_ACCESS_SIGNITUER=yourUserAccessSecret
USER_REFRESH_SIGNITUER=yourUserRefreshSecret
ADMIN_ACCESS_SIGNITUER=yourAdminAccessSecret
ADMIN_REFRESH_SIGNITUER=yourAdminRefreshSecret
ACCESS_TOKEN_EXPIRATION=<anyNumber>m
REFRESH_TOKEN_EXPIRATION=<anyNumber>d
SALT=anyRoundNumberFrom1To14
ENCRYPTION_KEY=32-character-random-string-for-AES
OTP_ALPHABET=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
OTP_SIZE=anySizeNumber
CLIENT_ID=your-google-oauth-client-id
EXPIRATION=anyNumberinMilliseconds
```

4. Run the server

```bash
npm start
```

The server should now be running on `http://localhost:<PORT>`

## API Endpoints

### Auth Module

| Endpoint                          | Method | Description                   | Validation             | Allow TO  |
|-----------------------------------|--------|-------------------------------|------------------------|-----------|   
| `/auth/signup`                    | POST   | Register new user             | SignupSchema           | All       |
| `/auth/login`                     | POST   | Login with email & password   | LoginSchema            | All       |
| `/auth/social-login`              | POST   | Google OAuth login            | -                      | All       |
| `/auth/confirm_email`             | PATCH  | Confirm email with OTP        | ConfirmEmailSchema     | All       |
| `/auth/forget_password`           | PATCH  | Request password reset OTP    | ForgetPasswordSchema   | All       |
| `/auth/change_password`           | PATCH  | Change password with OTP      | ChangePasswordSchema   | All       |
| `/auth/refresh`                   | PATCH  | Refresh access token          | -                      | All       |
| `/auth/resend-password-code`      | PATCH  | Resend password OTP           | ResendOtpSchema        | All       |
| `/auth/resend-confirm-code`       | PATCH  | Resend email confirmation OTP | ResendOtpSchema        | All       |
| `/auth/update-email`              | PATCH  | Update User Email             | updateEmailSchema      | All       |
| `/auth/confirm-new-email`         | PATCH  | Confirm New Email             | confirmNewEmailSchema  | All       |
| `/auth/resend-confirm-email-code` | PATCH  | Resend New Email OTP          | -                      | All       |
| `/auth/update-password`           | PATCH  | Update Account Password       | updatePasswordSchema   | All       |


### User Module

| Endpoint                 | Method | Description                      | Auth Required | Validation          |Allow To  |
|--------------------------|--------|----------------------------------|---------------|---------------------|----------|
| `/user/share-profile`    | GET    | Get shareable user profile link  | Yes           | -                   | All      |
| `/user/user-profile/:id` | GET    | Get public user profile          | No            | checkIdSchema       | All      |
| `/user/update`           | PATCH  | Update user profile (name, phone)| Yes           | UpdateProfileSchema | All      |
| `/user/deactivate/:id`   | PATCH  | Deactivate User Account          | Yes           | checkIdSchema       | All      |
| `/user/activate/:id`     | PATCH  | Activate User Account            | Yes           | checkIdSchema       | All      |
| `/user/upload-image`     | PATCH  | Upload Profile Image             | Yes           | Multer upload       | All      |
| `/user/delete/:id`       | DELETE | Delete User Account              | Yes           | checkIdSchema       | Admin    |

## Folder Structure

```
Saraha-App/
├── src/
│   ├── DB/
│   │   ├── Models/
│   │   │   └── userModel.js
│   │   ├── DBservices.js
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
│   │   ├── messageModule/
|   |   |    ├── message.controller.js
|   |   |    ├── message.services.js
|   |   |    ├── message.validation.js
|   |   |    └── ...
|   |   └── ...
│   │
│   ├── Utils/
│   │   ├── ConfirmEmail/
│   │   │   ├── emailEmitter.js
│   │   │   ├── sendEmail.js
│   │   │   └── generateHTML.js
│   │   ├── bcrypt.js
│   │   ├── crypto.js
│   │   ├── errors.js
│   │   └── successHandler.js
│   │   └── multer/
│   │       └── multer.js
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
- Joi validation ensures clean and safe input handling.
- Multer uploads images into user-specific directories for better organization

## License

MIT License
