# Y-PoS

<img width="2752" height="1404" alt="shaishab316-YPoS-banner" src="https://github.com/user-attachments/assets/81b98844-1c51-4ea9-ba6a-839ee77242b3" />

---

A restaurant Point of Sale (POS) backend built with NestJS, TypeScript, PostgreSQL, and Prisma.

Y-PoS provides the API layer for restaurant operations, from managing menu items and orders to processing payments, tracking inventory, and generating reports.

The project is organized around independent business modules, with shared infrastructure for database access, caching, real-time communication, background jobs, and file uploads.

## Overview

Y-PoS is designed to support the day-to-day operations of a restaurant through a modular backend architecture.

The application uses:

- **NestJS** to organize business logic into modules.
- **PostgreSQL** to store application data.
- **Prisma** to manage database models and queries.
- **Redis** for caching and supporting background jobs.
- **Socket.IO** for real-time communication.

The repository includes the application source code, database schema and migrations, API documentation, development tooling, and Docker Compose configurations for local development and production deployment.

## Features

### Restaurant operations

- Menu and section management
- Menu items with configurable packet sections and choices
- Restaurant table management
- Order creation, retrieval, and status management
- Production station management
- Operating hours and shift management

### Payments

- Payment creation and retrieval
- Payment status management and verification workflows
- Payment mismatch handling
- Payment summaries and reporting
- Today's payment export

### Inventory and reporting

- Inventory management
- Sales analytics and reporting
- Order and payment filtering
- Paginated API endpoints
- Reporting and data export

### Backend infrastructure

- JWT-based authentication
- Request validation using Zod and NestJS integration
- Redis-backed caching
- Real-time communication with Socket.IO
- Background job processing with BullMQ
- File uploads through Cloudinary
- Structured application logging with Winston
- API rate limiting
- Health checks and observability
- Docker-based development and deployment

Some integrations require additional configuration. Check the relevant source code and configuration files for implementation details.

## Tech Stack

| Category                | Technology             |
| ----------------------- | ---------------------- |
| Runtime                 | Node.js                |
| Language                | TypeScript             |
| Backend framework       | NestJS                 |
| HTTP platform           | Express                |
| Database                | PostgreSQL             |
| ORM                     | Prisma                 |
| Validation              | Zod, nestjs-zod        |
| Cache                   | Redis, ioredis         |
| Background jobs         | BullMQ                 |
| Real-time communication | Socket.IO              |
| Authentication          | Passport, JWT          |
| File storage            | Cloudinary             |
| API documentation       | Swagger, Scalar        |
| Logging                 | Winston                |
| Testing                 | Jest, Supertest        |
| Containerization        | Docker, Docker Compose |
| Package manager         | pnpm                   |

## Architecture

<img width="2752" height="1536" alt="shaishab316-YPoS-lld" src="https://github.com/user-attachments/assets/37fa241c-736e-43fc-a862-d1ab84f7beae" />

---

Y-PoS follows a modular, domain-oriented architecture.

Each business domain has its own NestJS module, keeping related controllers, DTOs, and services together. Shared infrastructure and cross-cutting concerns are handled separately.

This structure makes it easier to locate business logic, understand how a feature works, and make changes without unnecessarily affecting unrelated modules.

```text
Client Applications
        |
        v
   NestJS REST API
        |
        +-- Authentication
        +-- Orders & Payments
        +-- Menu & Items
        +-- Inventory
        +-- Production
        +-- Analytics & Reporting
        |
        v
   Infrastructure
        |
        +-- PostgreSQL / Prisma
        +-- Redis
        +-- Socket.IO
        +-- BullMQ
        +-- Cloudinary
```

### Architectural principles

**Modularity**

Business logic belongs to its respective domain. Related functionality should remain together rather than being spread across unrelated modules.

**Separation of concerns**

Controllers handle HTTP requests, while services contain application logic. DTOs define and validate the data accepted by the API.

**Shared infrastructure**

Common integrations such as Prisma, Redis, file uploads, and other infrastructure services are organized independently from business domains.

**Type safety**

TypeScript and validated DTOs help maintain consistent API contracts and reduce errors when working with application data.

**Maintainability**

Follow existing module patterns and keep domain-specific logic separate. Important architectural decisions should be documented.

## Getting Started

This section covers setting up a local development environment.

### Prerequisites

Make sure the following tools are installed:

- Node.js 20 or later
- pnpm 10.20.0 or later
- Docker and Docker Compose
- Git

PostgreSQL and Redis must be available before the application can run. The provided development Docker Compose configuration can be used to start the supporting services.

### 1. Clone the repository

```bash
git clone https://github.com/shaishab316/Y-PoS.git

cd Y-PoS
```

### 2. Install dependencies

Enable Corepack and install the project dependencies:

```bash
corepack enable

pnpm install
```

### 3. Configure environment variables

Create your local environment file:

```bash
cp .env.example .env
```

Update the required values for your development environment, including database connectivity, Redis, authentication, and any external integrations you intend to use.

The exact environment variable names and required values are defined in `.env.example` and the application's configuration files.

### 4. Start the supporting services

```bash
docker compose up -d
```

This starts the services defined in the development Compose configuration.

Make sure PostgreSQL and Redis are running and accessible using the connection settings in your `.env` file.

### 5. Generate the Prisma client

```bash
pnpm prisma:generate
```

This generates the Prisma client used by the application.

Run this command after installing dependencies and whenever the Prisma schema changes.

### 6. Apply database migrations

```bash
pnpm prisma:migrate
```

This applies the development database migrations.

### 7. Start the development server

```bash
pnpm start:dev
```

The NestJS application starts in watch mode, allowing changes to the source code to trigger a development restart.

## Environment Configuration

Y-PoS uses environment-based configuration to support different environments.

The following categories may require configuration:

| Category       | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| Application    | Runtime environment, port, and application settings   |
| PostgreSQL     | Database connection and Prisma configuration          |
| Redis          | Caching and background-job infrastructure             |
| Authentication | JWT and authentication-related secrets                |
| Cloudinary     | File uploads and media storage                        |
| Email          | SMTP and notification delivery                        |
| Payments       | Payment provider credentials and integration settings |
| Logging        | Application logging and observability                 |

Refer to `.env.example` and the application configuration for the actual variable names, required values, and defaults.

**Security:** Never commit `.env` files, credentials, API keys, or production secrets to version control. Use separate credentials for development and production.

## Database

Y-PoS uses PostgreSQL for persistent storage and Prisma as its ORM.

The Prisma schema is split into multiple files under `prisma/schema/`, allowing database models to be organized by domain.

```text
prisma/
├── migrations/
│   ├── .../
│   └── migration_lock.toml
└── schema/
    ├── schema.prisma
    ├── enum.prisma
    ├── business.prisma
    ├── user.prisma
    ├── menu.prisma
    ├── section.prisma
    ├── item.prisma
    ├── order.prisma
    ├── payment.prisma
    ├── inventory.prisma
    └── ...
```

### Database commands

| Command                | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `pnpm prisma:generate` | Generate the Prisma client               |
| `pnpm prisma:migrate`  | Create and apply a development migration |
| `pnpm prisma:studio`   | Open Prisma Studio                       |
| `pnpm prisma:seed`     | Seed the database                        |
| `pnpm create:admin`    | Create an admin account                  |

The seed and admin scripts may require additional environment configuration.

### Working with migrations

Keep database changes in version-controlled Prisma migrations.

When changing the schema:

1. Update the relevant Prisma model.
2. Create a descriptive migration.
3. Review the generated SQL before applying it.
4. Verify that the change works with the application.
5. Include the migration in your changes.

Do not modify migrations that have already been applied to shared or production databases. Use appropriate backups and deployment procedures before applying production migrations.

## Development

### Available scripts

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `pnpm start`       | Start the application                   |
| `pnpm start:dev`   | Start in watch mode                     |
| `pnpm start:debug` | Start with debugging enabled            |
| `pnpm start:prod`  | Start the compiled application          |
| `pnpm build`       | Build the application                   |
| `pnpm lint`        | Run ESLint with automatic fixes         |
| `pnpm format`      | Format TypeScript source and test files |
| `pnpm test`        | Run unit tests                          |
| `pnpm test:watch`  | Run tests in watch mode                 |
| `pnpm test:cov`    | Run tests with coverage                 |
| `pnpm test:e2e`    | Run end-to-end tests                    |

### Recommended workflow

When working on a feature or fixing a bug:

1. Create a feature branch.
2. Locate the relevant business module.
3. Understand the existing implementation before making changes.
4. Update the necessary controllers, DTOs, services, or database models.
5. Add or update tests.
6. Run linting, formatting, and relevant tests.
7. Review the final changes before opening a pull request.

Follow the existing project conventions. Avoid introducing new patterns or unrelated refactoring when the current structure already supports the change.

## API Documentation

Y-PoS provides interactive API documentation through Swagger.

Start the development server:

```bash
pnpm start:dev
```

Once the server is running, open the following URL in your browser:

```text
http://localhost:3000/docs
```

Replace `3000` with your configured application port if necessary.

The documentation provides an interactive interface for exploring API endpoints, reviewing request and response schemas, and testing API requests.

All API endpoints are served under the `/api/v1` prefix.

### API conventions

- RESTful, resource-oriented endpoints
- JSON request and response payloads
- Query parameters for filtering and pagination
- DTO-based request validation
- Versioned API routes

For the complete endpoint list and request schemas, refer to the OpenAPI specification and API documentation configuration in the repository.

## Project Structure

The following is a high-level overview of the main directories:

```text
Y-PoS/
├── docs/                 # Architecture and technical documentation
├── prisma/
│   ├── migrations/       # Database migrations
│   └── schema/           # Modular Prisma schema
├── public/               # Static assets
├── scripts/              # Utility scripts
├── src/
│   ├── common/           # Shared application utilities
│   ├── infra/            # Infrastructure integrations
│   │   ├── mail/
│   │   ├── prisma/
│   │   ├── redis/
│   │   ├── socket/
│   │   └── upload/
│   ├── modules/          # Business domain modules
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── health/
│   │   ├── inventory/
│   │   ├── item/
│   │   ├── menu/
│   │   ├── order/
│   │   ├── payment/
│   │   ├── production-station/
│   │   ├── reporting/
│   │   ├── section/
│   │   ├── shift/
│   │   ├── table/
│   │   └── user/
│   ├── app.module.ts
│   └── main.ts
├── test/                 # End-to-end test configuration
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
└── pnpm-lock.yaml
```

### Where to start

If you're new to the codebase, these are the directories worth understanding first:

| Directory      | What you'll find                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `src/modules/` | Business logic, controllers, services, DTOs, and module definitions                                 |
| `src/infra/`   | Integrations such as Prisma, Redis, Socket.IO, email, and Cloudinary                                |
| `src/common/`  | Shared configuration, decorators, guards, interceptors, middleware, filters, helpers, and utilities |
| `prisma/`      | Database schema and migration history                                                               |
| `docs/`        | Architecture, database, file-upload, caching, and codebase documentation                            |
| `test/`        | End-to-end test configuration                                                                       |

A good starting point is the module responsible for the feature you're working on. From there, follow the controller into its service and check which shared infrastructure or database models it uses.

## Testing

Y-PoS uses Jest for unit testing and supports end-to-end testing.

Run unit tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Generate a coverage report:

```bash
pnpm test:cov
```

Run end-to-end tests:

```bash
pnpm test:e2e
```

### Testing guidelines

- Test business logic independently from HTTP concerns.
- Cover successful operations and important failure cases.
- Add regression tests when fixing bugs.
- Test database-dependent behavior with an appropriate test database.
- Avoid relying on production services or credentials during tests.

---

Built with TypeScript and NestJS by [Shaishab Chandra Shil](https://github.com/shaishab316).
