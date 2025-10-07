# Testing with Vitest

This project uses [Vitest](https://vitest.dev/) for testing, which provides a fast and modern testing framework that's compatible with Jest but optimized for Vite.

## Setup

The testing setup includes:

- **Vitest**: Fast unit testing framework
- **@vitest/ui**: Web UI for running and debugging tests
- **jsdom**: DOM environment for testing React components
- **@testing-library/react**: React testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

## Running Tests

### Available Scripts

```bash
# Run tests in watch mode (development)
pnpm test

# Run tests once and exit
pnpm test:run

# Run tests with UI (opens in browser)
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

### Test Structure

Tests are organized as follows:

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── bank-utils.test.ts      # Utility function tests
│   │   └── validations.test.ts     # Validation schema tests
│   └── bank-utils.ts
├── app/
│   └── api/
│       └── __tests__/
│           └── bank-transactions.test.ts  # API route tests
└── test/
    ├── setup.ts                    # Test setup and mocks
    └── vitest.d.ts                 # TypeScript declarations
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest"
import { myFunction } from "../my-module"

describe("MyModule", () => {
  it("should do something", () => {
    const result = myFunction("input")
    expect(result).toBe("expected output")
  })
})
```

### Testing API Routes

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "../route"

// Mock dependencies
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

describe("API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should handle requests", async () => {
    const request = new NextRequest("http://localhost:3000/api/endpoint")
    const response = await GET(request)

    expect(response.status).toBe(200)
  })
})
```

### Testing React Components

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MyComponent } from "../MyComponent"

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />)
    expect(screen.getByText("Hello World")).toBeInTheDocument()
  })
})
```

## Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".next", ".turbo"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
```

### Test Setup (`src/test/setup.ts`)

The setup file includes:

- Jest DOM matchers
- Next.js router mocks
- NextAuth mocks
- Global fetch mock
- Crypto API mocks

## Best Practices

1. **Test Structure**: Use `describe` blocks to group related tests
2. **Naming**: Use descriptive test names that explain what is being tested
3. **Mocking**: Mock external dependencies and APIs
4. **Isolation**: Each test should be independent and not rely on other tests
5. **Coverage**: Aim for good test coverage of critical business logic
6. **Performance**: Use `vi.fn()` for simple mocks, `vi.mocked()` for type-safe mocking

## Examples

### Testing Utility Functions

```typescript
import { describe, it, expect } from "vitest"
import { parseCSV, generateTransactionHash } from "../bank-utils"

describe("Bank Utils", () => {
  describe("parseCSV", () => {
    it("should parse CSV with correct headers", () => {
      const csvText = `Date,Amount,Description
13/08/2025,50.00,Test transaction`

      const result = parseCSV(csvText)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        Date: "13/08/2025",
        Amount: "50.00",
        Description: "Test transaction",
      })
    })
  })
})
```

### Testing Validation Schemas

```typescript
import { describe, it, expect } from "vitest"
import { bankTransactionCsvRowSchema } from "../validations"

describe("Validation Schemas", () => {
  it("should validate correct data", () => {
    const validData = {
      date: "13/08/2025",
      amount: "50.00",
      description: "Test",
    }

    const result = bankTransactionCsvRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("should reject invalid data", () => {
    const invalidData = {
      date: "invalid-date",
      amount: "not-a-number",
      description: "",
    }

    const result = bankTransactionCsvRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
```

## Debugging Tests

### Using the UI

```bash
pnpm test:ui
```

This opens a web interface where you can:

- Run individual tests
- See test results in real-time
- Debug failing tests
- View coverage reports

### VS Code Integration

Install the Vitest extension for VS Code to get:

- Test discovery
- Run tests from the editor
- Debug support
- Test result display

## Continuous Integration

The test suite is designed to run in CI environments:

```bash
# In CI, run tests once
pnpm test:run

# With coverage
pnpm test:coverage
```

This ensures all tests pass before deployment and provides coverage metrics for code quality monitoring.
