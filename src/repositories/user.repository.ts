import { Prisma } from '../generated/prisma';
import { prisma } from '../config/prisma';

export class UserRepository {
    async findByEmail(email: string) {
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

    async create(data: Prisma.UserCreateInput) {
        return await prisma.user.create({
            data,
        });
    }
}

export const userRepository = new UserRepository();
