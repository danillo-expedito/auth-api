import { SignOptions } from 'jsonwebtoken';

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined on .env file');
    }
    return secret;
};

const getRefreshJwtSecret = (): string => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not defined on .env file');
    }
    return refreshSecret;
};

const VALID_FORMAT = /^\d+[smhdy]$/;

const getExpirationTime = (): NonNullable<SignOptions['expiresIn']> => {
    const expirationTime = process.env.JWT_EXPIRES_IN;
    if (!expirationTime || !VALID_FORMAT.test(expirationTime)) {
        throw new Error('JWT_EXPIRES_IN is undefined');
    }

    return expirationTime as NonNullable<SignOptions['expiresIn']>;
};

const getRefreshExpirationTime = (): NonNullable<SignOptions['expiresIn']> => {
    const refreshExpirationTime = process.env.JWT_REFRESH_EXPIRES_IN;
    if (!refreshExpirationTime || !VALID_FORMAT.test(refreshExpirationTime)) {
        throw new Error(
            'JWT_REFRESH_EXPIRES_IN is undefined or has an invalid format',
        );
    }
    return refreshExpirationTime as NonNullable<SignOptions['expiresIn']>;
};

export const JWT_SECRET = getJwtSecret();
export const JWT_REFRESH_SECRET = getRefreshJwtSecret();
export const JWT_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> =
    getExpirationTime();
export const JWT_REFRESH_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> =
    getRefreshExpirationTime();

export const calculateRefreshExpiresAt = (): Date => {
    const timeStr = String(JWT_REFRESH_EXPIRES_IN);
    const value = parseInt(timeStr, 10);
    const unit = timeStr.slice(-1).toLowerCase();

    const date = new Date();

    switch (unit) {
        case 'd':
            date.setDate(date.getDate() + value);
            break;
        case 'h':
            date.setHours(date.getHours() + value);
            break;
        case 'm':
            date.setMinutes(date.getMinutes() + value);
            break;
        case 's':
            date.setSeconds(date.getSeconds() + value);
            break;
        default:
            date.setDate(date.getDate() + 7);
    }

    return date;
};
