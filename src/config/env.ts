import { SignOptions } from 'jsonwebtoken';

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined on .env file');
    }
    return secret;
};

const VALID_FORMAT = /^\d+[smhdy]$/;

const getExpirationTime = (): NonNullable<SignOptions['expiresIn']> => {
    const expirationTime = process.env.JWT_EXPIRES_IN;
    if (!expirationTime || !VALID_FORMAT.test(expirationTime)) {
        throw new Error('JWT_EXPIRES_IN is undefined');
    }

    return expirationTime as NonNullable<SignOptions['expiresIn']>;
};

export const JWT_SECRET = getJwtSecret();
export const JWT_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> =
    getExpirationTime();
