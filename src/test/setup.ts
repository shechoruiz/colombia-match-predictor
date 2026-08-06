import '@testing-library/jest-dom/vitest'
import { server } from './server'

// MSW lifecycle: intercept upstream calls for every test file. Individual
// tests override handlers per-case with `server.use(...)`.
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())