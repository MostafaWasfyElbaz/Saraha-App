export class missingFields extends Error {
  constructor() {
    super("Missing required fields", { cause: 422 });
  }
}

export class notFoundUser extends Error {
  constructor() {
    super("User Not Found", { cause: 404 });
  }
}

export class expiredCode extends Error {
  constructor() {
    super("code has expired. Please request a new one.", { cause: 400 });
  }
}

export class invalidCredentials extends Error {
  constructor() {
    super("Invalid credentials", { cause: 404 });
  }
}

export class emailAlreadyConfirmed extends Error {
  constructor() {
    super("Email already confirmed", { cause: 400 });
  }
}

export class emailNotConfirmed extends Error {
  constructor() {
    super("Email not confirmed", { cause: 400 });
  }
}

export class existEmail extends Error {
  constructor() {
    super("Email already exists", { cause: 409 });
  }
}

export class unauthorizedAccess extends Error {
  constructor() {
    super("Unauthorized Access", { cause: 401 });
  }
}

export class userIsNotActive extends Error {
  constructor() {
    super("User is not active", { cause: 401 });
  }
}

export class deleteAdminAccount extends Error {
  constructor() {
    super("You can't delete admin account", { cause: 400 });
  }
}
