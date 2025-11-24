import { SQLModel, Field } from 'sqlmodel-ts';

export class User extends SQLModel {
  @Field({ primaryKey: true })
  id!: number;

  @Field({ unique: true, index: true })
  email!: string;

  @Field()
  password!: string;
}

export class RefreshToken extends SQLModel {
  @Field({ primaryKey: true })
  id!: number;

  @Field()
  token!: string;

  @Field()
  userId!: number;

  @Field()
  expiresAt!: Date;
}

