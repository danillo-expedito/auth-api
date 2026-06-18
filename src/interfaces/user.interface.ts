export interface IUser {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserRegister extends Pick<IUser, 'name' | 'email'> {
    passwordHash: string;
}

export interface IUserCreate {
    name: string;
    email: string;
    passwordHash: string;
}

export type IUserResponse = Omit<IUser, 'passwordHash'>;
