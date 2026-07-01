import { userRepository } from '../repositories/user.repository';
import { IUser, IUserResponse } from '../interfaces/user.interface';
import { ConflictError } from '../errors/ConflictError';
import bcrypt from 'bcryptjs';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import jwt from 'jsonwebtoken';
import {
    JWT_REFRESH_EXPIRES_IN,
    JWT_EXPIRES_IN,
    JWT_SECRET,
    calculateRefreshExpiresAt,
    JWT_REFRESH_SECRET,
} from '../config/env';
import { NotFoundError } from '../errors/NotFoundError';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { passwordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { transporter } from '../config/mailer';
import crypto from 'crypto';
import { BadRequestError } from '../errors/BadRequestError';

// Hash fixo usado para mitigar timing attacks quando o usuário não existe
// (gerado com bcrypt.hashSync('dummy_password', 10))
const DUMMY_HASH =
    '$2b$10$7/u2Oo.tzZYmi.ZWRifx5eLR.6PZrv.Js8r0b06Zq2NAd3X8.9VRW';
export class UserService {
    async registerUser(
        name: string,
        email: string,
        password: string,
    ): Promise<IUserResponse> {
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new ConflictError(
                'Este e-mail está registrado em outra conta.',
            );
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            passwordHash: hash,
        };

        const { passwordHash: _, ...userWithoutPassword } =
            await userRepository.create(newUser);

        return userWithoutPassword;
    }

    async loginUser(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        const hashToCompare = user ? user.passwordHash : DUMMY_HASH;

        const passwordValidation = await bcrypt.compare(
            password,
            hashToCompare,
        );

        if (!user || !passwordValidation) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
        });

        const expiresAt = calculateRefreshExpiresAt();

        await refreshTokenRepository.create(user.id, refreshToken, expiresAt);

        return { accessToken, refreshToken };
    }

    async logoutUser(token: string): Promise<void> {
        const persistedToken = await refreshTokenRepository.findByToken(token);

        if (!persistedToken || persistedToken.revoked) {
            throw new UnauthorizedError('Token inválido ou expirado.');
        }

        await refreshTokenRepository.revoke(token);
    }

    async getMe(id: string) {
        const user = await userRepository.findById(id);

        if (!user) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        const { passwordHash: _, ...userWithouPassword } = user;

        return userWithouPassword;
    }

    async refreshUserToken(token: string): Promise<{ accessToken: string }> {
        try {
            jwt.verify(token, JWT_REFRESH_SECRET);
        } catch (error) {
            throw new UnauthorizedError('Token inválido ou expirado.');
        }

        const persistedToken = await refreshTokenRepository.findByToken(token);

        if (
            !persistedToken ||
            persistedToken.revoked ||
            new Date() > persistedToken.expiresAt
        ) {
            throw new UnauthorizedError('Token inválido ou expirado.');
        }

        const accessToken = jwt.sign(
            { id: persistedToken.userId },
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN,
            },
        );

        return { accessToken };
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = new Date();
        resetTokenExpiresAt.setMinutes(resetTokenExpiresAt.getMinutes() + 15);

        await passwordResetTokenRepository.create(
            user.id,
            resetToken,
            resetTokenExpiresAt,
        );

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: 'Redefinição de senha',
            html: `<p>Olá, ${user.name}!</p>
                    <p>Clique no link abaixo para redefinir sua senha:</p>
                    <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" target="_blank">Redefinir senha</a>
                    <p>Este link expira em 15 minutos.</p>`,
        });
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const resetToken =
            await passwordResetTokenRepository.findByToken(token);

        if (
            !resetToken ||
            resetToken.used ||
            new Date() > resetToken.expiresAt
        ) {
            throw new BadRequestError('Token inválido ou expirado.');
        }

        const hash = await bcrypt.hash(newPassword, 10);

        await userRepository.updatePassword(resetToken.userId, hash);
        await passwordResetTokenRepository.markAsUsed(token);
    }
}

export const userService = new UserService();
