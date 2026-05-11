# POS System — Backend Architecture

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js |
| Framework | NestJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Realtime | Socket.IO |
| Queue | BullMQ |
| Cache | Redis |
| File Storage | Cloudinary (or S3) |
| Auth | JWT (access + refresh) |
| Process Manager | PM2 |

---

## File Structure

```
src/
├── main.ts
├── app.module.ts
│
├── prisma/
│   ├── prisma.service.ts
│   ├── prisma.module.ts
│   └── schema/
│       ├── schema.prisma
│       ├── enum.prisma
│       ├── user.prisma
│       ├── business.prisma
│       ├── production.prisma
│       ├── item.prisma
│       ├── menu.prisma
│       ├── section.prisma
│       ├── table.prisma
│       ├── order.prisma
│       ├── payment.prisma
│       ├── inventory.prisma
│       ├── shift.prisma
│       └── notification.prisma
│
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── global-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── utils/
│       ├── slug.util.ts        # generates u-00001, o-00001, etc.
│       ├── pagination.util.ts
│       └── date.util.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── jwt-refresh.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── refresh-token.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── business/
│   ├── business.module.ts
│   ├── business.controller.ts
│   ├── business.service.ts
│   └── dto/
│       ├── update-business.dto.ts
│       ├── create-operating-hour.dto.ts
│       ├── create-holiday.dto.ts
│       └── create-global-charge.dto.ts
│
├── production/
│   ├── production.module.ts
│   ├── production.controller.ts
│   ├── production.service.ts
│   └── dto/
│       ├── create-station.dto.ts
│       └── update-station.dto.ts
│
├── menu/
│   ├── menu.module.ts
│   ├── menu.controller.ts
│   ├── menu.service.ts
│   └── dto/
│       ├── create-menu.dto.ts
│       └── update-menu.dto.ts
│
├── section/
│   ├── section.module.ts
│   ├── section.controller.ts
│   ├── section.service.ts
│   └── dto/
│       ├── create-section.dto.ts
│       └── update-section.dto.ts
│
├── items/
│   ├── items.module.ts
│   ├── items.controller.ts
│   ├── items.service.ts
│   └── dto/
│       ├── create-item.dto.ts
│       ├── update-item.dto.ts
│       └── create-packet-section.dto.ts
│
├── tables/
│   ├── tables.module.ts
│   ├── tables.controller.ts
│   ├── tables.service.ts
│   └── dto/
│       ├── create-table.dto.ts
│       └── generate-qr.dto.ts
│
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── dto/
│       ├── create-order.dto.ts
│       ├── update-order.dto.ts
│       └── cancel-order-item.dto.ts
│
├── payment/
│   ├── payment.module.ts
│   ├── payment.controller.ts
│   ├── payment.service.ts
│   └── dto/
│       ├── create-payment.dto.ts
│       └── upload-proof.dto.ts
│
├── inventory/
│   ├── inventory.module.ts
│   ├── inventory.controller.ts
│   ├── inventory.service.ts
│   └── dto/
│       ├── create-inventory-log.dto.ts
│       └── inventory-report.dto.ts
│
├── shift/
│   ├── shift.module.ts
│   ├── shift.controller.ts
│   ├── shift.service.ts
│   └── dto/
│       ├── open-shift.dto.ts
│       └── close-shift.dto.ts
│
├── reporting/
│   ├── reporting.module.ts
│   ├── reporting.controller.ts
│   └── reporting.service.ts
│
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   └── notifications.gateway.ts   # Socket.IO gateway
│
└── upload/
    ├── upload.module.ts
    ├── upload.controller.ts
    └── upload.service.ts
```

---

## API Routes

> Auth: `OWNER` and `ADMIN` only require JWT. Public routes marked `[PUBLIC]`.

---

### Auth

| Method | URL | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Login with username + password, returns access + refresh token | PUBLIC |
| POST | `/auth/refresh` | Refresh access token | PUBLIC |
| POST | `/auth/logout` | Invalidate refresh token | OWNER, ADMIN |

---

### Users

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/users` | List all users | OWNER |
| POST | `/users` | Create admin user | OWNER |
| GET | `/users/:id` | Get user by id | OWNER |
| PATCH | `/users/:id` | Update user | OWNER |
| PATCH | `/users/:id/password` | Change password | OWNER, ADMIN (own) |
| DELETE | `/users/:id` | Soft delete (isActive=false) | OWNER |

---

### Business Profile

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/business` | Get business profile | OWNER, ADMIN |
| PATCH | `/business` | Update business profile | OWNER |
| POST | `/business/operating-hours` | Add operating hour | OWNER |
| DELETE | `/business/operating-hours/:id` | Remove operating hour | OWNER |
| POST | `/business/holidays` | Add holiday | OWNER |
| DELETE | `/business/holidays/:id` | Remove holiday | OWNER |
| GET | `/business/charges` | List global charges | OWNER, ADMIN |
| POST | `/business/charges` | Add charge (max 5) | OWNER |
| PATCH | `/business/charges/:id` | Update charge | OWNER |
| DELETE | `/business/charges/:id` | Delete charge | OWNER |

---

### Production Stations

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/production-stations` | List all stations | OWNER, ADMIN |
| POST | `/production-stations` | Create station (max 3) | OWNER |
| PATCH | `/production-stations/:id` | Update station | OWNER |
| DELETE | `/production-stations/:id` | Delete station | OWNER |

---

### Menu

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/menus` | List all menus | OWNER, ADMIN |
| GET | `/menus/public` | Public menu view (touchscreen/QR) | PUBLIC |
| POST | `/menus` | Create menu | OWNER, ADMIN |
| GET | `/menus/:id` | Get menu by id | OWNER, ADMIN |
| PATCH | `/menus/:id` | Update menu | OWNER, ADMIN |
| DELETE | `/menus/:id` | Delete menu | OWNER |

---

### Sections

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/sections` | List sections (filter by menuId) | OWNER, ADMIN |
| POST | `/sections` | Create section | OWNER, ADMIN |
| PATCH | `/sections/:id` | Update section | OWNER, ADMIN |
| DELETE | `/sections/:id` | Delete section | OWNER, ADMIN |
| POST | `/sections/:id/items` | Add item to section | OWNER, ADMIN |
| DELETE | `/sections/:id/items/:itemId` | Remove item from section | OWNER, ADMIN |
| PATCH | `/sections/:id/items/reorder` | Update sortOrder of items | OWNER, ADMIN |

---

### Items

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/items` | List all items | OWNER, ADMIN |
| POST | `/items` | Create item | OWNER, ADMIN |
| GET | `/items/:id` | Get item by id | OWNER, ADMIN |
| PATCH | `/items/:id` | Update item | OWNER, ADMIN |
| DELETE | `/items/:id` | Delete item | OWNER |
| POST | `/items/:id/packet-sections` | Add packet section | OWNER, ADMIN |
| PATCH | `/items/:id/packet-sections/:sectionId` | Update packet section | OWNER, ADMIN |
| DELETE | `/items/:id/packet-sections/:sectionId` | Delete packet section | OWNER, ADMIN |
| POST | `/items/:id/packet-sections/:sectionId/choices` | Add choice to packet section | OWNER, ADMIN |
| PATCH | `/items/:id/packet-sections/:sectionId/choices/:choiceId` | Update choice | OWNER, ADMIN |
| DELETE | `/items/:id/packet-sections/:sectionId/choices/:choiceId` | Delete choice | OWNER, ADMIN |

---

### Tables

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/tables` | List all tables | OWNER, ADMIN |
| POST | `/tables` | Create table | OWNER |
| PATCH | `/tables/:id` | Update table | OWNER |
| DELETE | `/tables/:id` | Delete table | OWNER |
| POST | `/tables/generate-qr` | Generate QR codes for N tables | OWNER |
| GET | `/tables/:id/qr` | Get QR image for table | OWNER, ADMIN |

---

### Orders

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/orders` | List orders (filter: status, date, source) | OWNER, ADMIN |
| POST | `/orders` | Create order (staff / admin) | OWNER, ADMIN |
| POST | `/orders/public` | Create order (QR / touchscreen) | PUBLIC |
| GET | `/orders/:id` | Get order by id | OWNER, ADMIN |
| PATCH | `/orders/:id` | Update order (before payment) | OWNER, ADMIN |
| PATCH | `/orders/:id/status` | Update order status | OWNER, ADMIN |
| PATCH | `/orders/:id/items/:itemId/status` | Update order item status (PROCESSING → READY → PICKED_UP) | OWNER, ADMIN |
| PATCH | `/orders/:id/items/:itemId/cancel` | Cancel order item (sent to admin review) | OWNER, ADMIN |
| PATCH | `/orders/:id/assign` | Assign order to service staff | OWNER, ADMIN |

---

### Payment

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/payments` | List payments (filter by date, method, status) | OWNER, ADMIN |
| POST | `/payments` | Create payment for order | OWNER, ADMIN |
| GET | `/payments/:id` | Get payment by id | OWNER, ADMIN |
| PATCH | `/payments/:id/proof` | Upload payment proof image | OWNER, ADMIN |
| PATCH | `/payments/:id/submit` | Submit payment (send order to production) | OWNER, ADMIN |

---

### Inventory

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/inventory` | Get inventory log (filter by date, item) | OWNER, ADMIN |
| POST | `/inventory` | Create inventory log entry | OWNER, ADMIN |
| PATCH | `/inventory/:id` | Update inventory log entry | OWNER, ADMIN |
| GET | `/inventory/report` | Export inventory report (PDF/Excel) | OWNER, ADMIN |

---

### Shift

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/shifts` | List shift sessions | OWNER, ADMIN |
| POST | `/shifts/open` | Start shift (opening workflow) | OWNER, ADMIN |
| POST | `/shifts/close` | Close shift (closing workflow) | OWNER, ADMIN |
| GET | `/shifts/:id` | Get shift by id | OWNER, ADMIN |
| POST | `/shifts/:id/cash-proof` | Upload cash storage proof image | OWNER, ADMIN |
| GET | `/shifts/:id/cash-proofs` | List cash proofs for shift | OWNER, ADMIN |
| PATCH | `/shifts/:id/cash-proofs/:proofId/verify` | Verify cash proof image | OWNER |

---

### Reporting

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/reports/sales` | Total sales by date range | OWNER, ADMIN |
| GET | `/reports/top-sellers` | Top 5 items per category | OWNER, ADMIN |
| GET | `/reports/order-types` | Dine-in vs takeaway counts | OWNER, ADMIN |
| GET | `/reports/production-performance` | Avg production time, top slow items, orders/hour | OWNER, ADMIN |
| GET | `/reports/proof-of-payment` | All payment proof images | OWNER, ADMIN |
| GET | `/reports/export` | Export report as PDF or Excel | OWNER, ADMIN |

---

### Upload

| Method | URL | Description | Access |
|---|---|---|---|
| POST | `/upload/image` | Upload image (menu cover, item, payment proof, cash proof) | OWNER, ADMIN |

---

### Notifications (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `order:new` | Server → Production station | New order received |
| `order:item:ok` | Client → Server | Staff pressed OK on item (PROCESSING) |
| `order:item:ready` | Server → Collection | Item ready for pickup |
| `order:item:pickup` | Client → Server | Collection pressed Pick Up |
| `order:item:remind` | Client → Server | Manual remind from production |
| `order:item:cancel` | Client → Server | Item cancelled |
| `alarm:mute` | Client → Server | Mute alarm for station |

---

## Auth Flow

```
POST /auth/login
  → validate credentials
  → return { accessToken, refreshToken }

accessToken  → short-lived (15m), JWT
refreshToken → long-lived (7d), opaque nonce stored as SHA-256 hash in DB

POST /auth/refresh
  → validate refreshToken hash
  → rotate: invalidate old, issue new pair

Guards:
  JwtAuthGuard   → validates accessToken on every protected route
  RolesGuard     → checks UserRole (OWNER | ADMIN) from JWT payload
```

---

## Slug Generation

Generated at service level after insert, stored back to `slug` field.

```
Pattern: {prefix}-{id padded to 5 digits}

u-00001      → User
o-00001      → Order
pay-00001    → Payment
i-00001      → Item
m-00001      → Menu
sec-00001    → Section
ps-00001     → PacketSection
psc-00001    → PacketSectionChoice
t-00001      → Table
il-00001     → InventoryLog
n-00001      → Notification
ss-00001     → ShiftSession
```

---

## Order Lifecycle

```
[Customer / Staff creates order]
        ↓
   PENDING (payment page)
        ↓
   [Payment submitted]
        ↓
   PROCESSING → sent to production station via Socket.IO
        ↓
   [Production clicks READY per item]
        ↓
   READY → alert sent to collection page via Socket.IO
        ↓
   [Collection clicks PICK UP per item]
        ↓
   PICKED_UP → item cleared from screens
        ↓
   [All items PICKED_UP]
        ↓
   ORDER COMPLETE → disappears from kitchen + collection
```

---

## Key Business Rules (enforce in service layer)

- Only 1 `BusinessProfile` row (check before create)
- Max 3 `ProductionStation` records
- Max 5 `GlobalCharge` records
- Max 50 `Section` per `Menu`
- Max 50 `PacketSection` per packet `Item`
- Max 100 items in a packet (`maxPacketItems`)
- Orders cannot be edited after `Payment` is submitted
- `OrderItem` cancel → sets `isCancelled=true`, flags `cancelReviewedBy=null` for admin review
- `slug` generated after insert: `await prisma.model.update({ where: { id }, data: { slug } })`
- `orderNumber` is sequential per business day, reset daily or globally incrementing — set at service level
- Inventory grays out item on menu when `inventoryQty = 0` (`isOutOfStock=true`)
- `ShiftSession` type OPENING required before CLOSING can be created same day
- Low inventory threshold notification → emit via Socket.IO to admin room

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pos_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
APP_PORT=3000
NODE_ENV=production
```