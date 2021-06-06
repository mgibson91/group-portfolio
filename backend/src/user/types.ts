export class CreateUserDto {
  email: string;
  username: string;
  passwordHash: string;
}

// Public
export class User {
  id: string;
  email: string;
  username: string;
}
