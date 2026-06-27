import { prisma } from '../config/prisma';
import { Prisma } from '../generated/prisma';

export class RefreshTokenRepository {
    async create(userId: string, token: string, expiresAt: Date) {
        return await prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }

    async findByToken(token: string) {
        return await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }

    async revoke(token: string) {
        return await prisma.refreshToken.update({
            where: { token },
            data: { revoked: true },
        });
    }
}

export const refreshTokenRepository = new RefreshTokenRepository();
