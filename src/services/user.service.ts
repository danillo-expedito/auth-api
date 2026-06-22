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
} from '../config/env';
import { NotFoundError } from '../errors/NotFoundError';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';

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

        const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
        });

        const expiresAt = calculateRefreshExpiresAt();

        await refreshTokenRepository.create(user.id, refreshToken, expiresAt);

        return { accessToken, refreshToken };
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
        let decoded: { id: string };

        try {
            decoded = jwt.verify(token, JWT_SECRET) as unknown as {
                id: string;
            };
        } catch (error) {
            throw new UnauthorizedError('Token inválido ou expirado');
        }

        const persistedToken = await refreshTokenRepository.findByToken(token);

        if (!persistedToken || persistedToken.revoked) {
            throw new UnauthorizedError('Token inválido ou expirado.');
        }

        const isExpired = new Date() > persistedToken.expiresAt;
        if (isExpired) {
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
}

export const userService = new UserService();
