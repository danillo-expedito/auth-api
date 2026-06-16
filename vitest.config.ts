import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

config();

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        env: {
            NODE_ENV: 'test',
        },
    },
});
