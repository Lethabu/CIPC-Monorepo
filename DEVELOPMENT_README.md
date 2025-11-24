# CIPC Monorepo Development Guide

> Enterprise-grade development standards for the CIPC compliance platform

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x
- pnpm (recommended for monorepo)
- VS Code with recommended extensions

### Setup

```bash
# Clone the repository
git clone https://github.com/Lethabu/CIPC-Monorepo.git
cd CIPC-Monorepo

# Install dependencies (includes linting, testing, and formatting tools)
pnpm install

# Run development servers
pnpm dev

# Verify everything works
pnpm build && pnpm test
```

## 🛠️ Development Workflow

### Code Quality Standards

#### Automatic Code Quality

```bash
# Check all quality standards
pnpm lint              # ESLint across all apps
pnpm format:check     # Prettier validation
pnpm type-check       # TypeScript validation

# Auto-fix issues
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format entire codebase
```

#### Pre-commit Quality Gates

All code automatically passes:

- ESLint rules for code quality
- Prettier formatting standards
- TypeScript type checking
- Specification validation (SSDD compliance)
- Security scanning (TruffleHog)

### Specification-Driven Development

#### SSDD Tools

```bash
# Validate all specifications against SSDD best practices
pnpm validate:specs

# Generate API clients from specifications
pnpm generate:api-clients
```

#### Specification Standards

- **Verification Checklists**: `verify-XX-XX` format for automated testing
- **Version Control**: Semantic versioning for specification changes
- **Machine Readable**: OpenAPI 3.1 conversion planned
- **Contract Testing**: Runtime validation against specifications

### Testing

#### Test Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Generate coverage report
pnpm test -- --coverage
```

#### Testing Standards

- **Framework**: Jest with React Testing Library
- **Coverage Goal**: 80% minimum (branches/functions/lines/statements)
- **Environment**: jsdom for DOM testing
- **Mocks**: Pre-configured for Next.js, APIs, and browser APIs

### Development Servers

#### Individual Services

```bash
# Dashboard (host app)
pnpm --filter dashboard dev    # http://localhost:3000
