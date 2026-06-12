import { Prisma } from '../generated/prisma';
import { prisma } from '../config/prisma';

export const userRepository = {
    findByEmail: async (email: string) => {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        return user;
    },

    findById: async (id: string) => {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        return user;
    },

    create: async (data: Prisma.UserCreateInput) => {
        return await prisma.user.create({
            data,
        });
    },
};
