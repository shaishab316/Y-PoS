import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJsonBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();

    try {
      if (req.body?.data && typeof req.body.data === 'string') {
        req.body = JSON.parse(req.body.data);
      }
    } catch {
      throw new BadRequestException('Invalid JSON in request body');
    }

    return next.handle();
  }
}
