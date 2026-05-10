## 1. Project Structure

All business logic resides in `/src/modules/`. Each module must follow this standardized internal structure:

* **`x.module.ts`**: The entry point/container for the module.
* **`x.controller.ts`**: HTTP request handlers.
* **`x.service.ts`**: Core business logic.
* **`x.gateway.ts`**: Socket.io or asynchronous event handlers.
* **`/dto/`**: Data Transfer Objects using **Zod v4**.
* **`/repo/`**: Data access layer/repositories.

**Global Directories:**

* **`/src/common/[verb]/`**: Shared utility functions.
* **`/src/infra/`**: Infrastructure configuration (Database clients, External APIs, etc.).

## 2. Naming Conventions

Follow these casing rules strictly to ensure consistency:

| Target | Convention | Example |
| --- | --- | --- |
| **Directory Names** | `kebab-case` (lowercase) | `/src/modules/user-profile/` |
| **File Names** | `PascalCase.verb.ts` | `UserProfile.service.ts` |
| **Class Names** | `PascalCase` | `class UserProfileService {}` |

## 3. Implementation Rules

* **Validation**: Use **Zod v4** for all DTO schemas and type inference.
* **Testing**: Do **not** implement unit tests (MVP phase).
* **Logic Separation**: Controllers should only handle request/response mapping. Services must contain all business rules. Repositories must handle all DB queries.