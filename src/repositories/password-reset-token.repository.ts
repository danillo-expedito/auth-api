import { prisma } from '../config/prisma';

export class PasswordResetTokenRepository {
    async create(userId: string, token: string, expiresAt: Date) {
        return await prisma.passwordResetToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    async findByToken(token: string) {
        return await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }

    async markAsUsed(token: string) {
        return await prisma.passwordResetToken.update({
            where: { token },
            data: { used: true },
        });
    }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
