# File Upload Pattern (NestJS + Cloudinary)

## How it works
1. Route uses `createFileUploadInterceptor` to validate and parse multipart files
2. Controller receives validated file via `@UploadedFiles()`, body via `@Body()`
3. Body may arrive as stringified JSON in `data` field or as plain multipart fields
4. DTO is Zod-validated before any file processing
5. If file present → upload to Cloudinary → store returned `url` in DB

## Interceptor config shape
```ts
createFileUploadInterceptor({
  fields: [{
    name: 'fieldName',           // must match multipart field name
    maxCount: 1,
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }]
})
```

## Controller signature
```ts
@UploadedFiles() files: { profilePicture?: Express.Multer.File[] }
@Body() body: any

const raw = body['data'] ? safeJsonParse(body['data']) : body; // handle both body formats
const dto = schema.safeParse(raw);
if (!dto.success) throw new ZodValidationException(dto.error);

const file = files?.profilePicture?.[0]; // undefined if not sent
```

## Service signature
```ts
async update(userId: string, dto: UpdateDto, file?: Express.Multer.File) {
  const data = { ...dto };
  if (file) {
    const { url } = await this.cloudinary.uploadFile({
      file,
      folder: 'profile-pictures', // cloudinary folder
      resourceType: 'image',      // 'image' | 'video' | 'raw'
    });
    data.profilePicture = url;    // only url is stored
  }
  return this.repository.update(userId, data);
}
```

## Constraints
- File is always optional; routes work without it
- Cloudinary upload only triggers when file is present
- `cloudinary.uploadFile()` returns `{ url: string }` — only `url` is used
- One file per field (`maxCount: 1` is standard)