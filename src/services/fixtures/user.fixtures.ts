export const mockDate = new Date('2026-06-15T12:00:00.000Z');

export const mockUser = {
    id: 'uuid-123',
    name: 'Leon Kennedy',
    email: 'leon@email.com',
    passwordHash:
        '$2b$10$UkVvlyTi3sW42dgXKwF.mOPCYExgONtZHEpKmHItD9.NDA33S0Ig6',
    createdAt: mockDate,
    updatedAt: mockDate,
};

export const unauthorizedError = {
    message: 'Invalid credentials',
    statusCode: 401,
};
