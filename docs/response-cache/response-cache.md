# Cache Decorator Usage

## Decorators

- `@CacheKey('key')` — cache this route's response in Redis
- `@CacheTTL(n)` — TTL in **seconds**
- `@InvalidateCache('key1', 'key2', ...)` — delete keys after mutation (POST/PATCH/DELETE)

---

## Key Template Syntax

Dynamic values are injected using `:source.field` syntax.

| Source | Syntax |
|---|---|
| Route param | `:params.id` |
| Body field | `:body.userId` |
| Auth user field | `:user.id` |
| Query param | `:query.page` |

Query params are **auto-appended** and sorted. `menu:all` becomes `menu:all:limit=10&page=2`.

---

## Patterns

### GET list
```typescript
@Get()
@CacheKey('menu:all')
@CacheTTL(60 * 60)
getAllMenus() {}
```

### GET single by param
```typescript
@Get(':id')
@CacheKey('menu::params.id')
@CacheTTL(60 * 60)
getOne(@Param('id', ParseIntPipe) id: number) {}
```

### GET scoped to auth user
```typescript
@Get()
@CacheKey('orders::user.id')
@CacheTTL(60 * 10)
getMyOrders() {}
```

### POST / PATCH / DELETE — invalidate
```typescript
@Post()
@InvalidateCache('menu:all')
createMenu(@Body() body: CreateMenuDto) {}

@Patch(':id')
@InvalidateCache('menu:all', 'menu::params.id')
updateMenu(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMenuDto) {}

@Delete(':id')
@InvalidateCache('menu:all', 'menu::params.id')
deleteMenu(@Param('id', ParseIntPipe) id: number) {}
```

---

## Rules

- Always pair `@CacheKey` with `@CacheTTL`
- Never put `@CacheKey` on mutation routes (POST/PATCH/DELETE)
- Use `@InvalidateCache` on every route that changes data
- Invalidate **all affected keys** — both list and single-item if both are cached
- `:user.{}` resolves from `req.user` — only use safe fields like `id`, `role`