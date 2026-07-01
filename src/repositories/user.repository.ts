import { Prisma } from '../generated/prisma';
import { prisma } from '../config/prisma';
import { IUser, IUserCreate } from '../interfaces/user.interface';

export class UserRepository {
    async findByEmail(email: string): Promise<IUser | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        return user;
    }

    async findById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        return user;
    }

    async create(data: IUserCreate): Promise<IUser> {
        return await prisma.user.create({
            data,
        });
    }

    async update(id: string, data: Partial<IUserCreate>): Promise<IUser> {
        return await prisma.user.update({
            where: { id },
            data,
        });
    }

    async updatePassword(id: string, passwordHash: string): Promise<IUser> {
        return await prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
    }
}

export const userRepository = new UserRepository();
