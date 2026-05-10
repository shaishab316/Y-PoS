/* eslint-disable @typescript-eslint/require-await */
import { ThrottlerGuard } from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import {
  THROTTLE_SKIP_PATTERNS,
  BOT_USER_AGENTS,
} from '../config/throttler.config';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);
  protected reflector: Reflector;

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
    this.reflector = reflector;
  }

  /**
   * Override canActivate to add custom logic
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;

    // Skip throttling for health/docs endpoints
    if (THROTTLE_SKIP_PATTERNS.some((pattern) => path.startsWith(pattern))) {
      return true;
    }

    // Skip if explicitly marked with @SkipThrottle()
    const skipThrottle = this.reflector.getAllAndOverride('skip_throttle', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Get the tracker key - uses user ID if authenticated, IP if not
   * Bots are tracked separately for aggressive throttling
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userAgent = req.headers['user-agent'] || '';
    const isBot = this.detectBot(userAgent);

    // If it's a bot and not authenticated, use a special bot prefix
    if (isBot && !req.user?.id) {
      return `bot:${this.getClientIp(req)}`;
    }

    // Authenticated users tracked by ID
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    // Unauthenticated users tracked by IP
    return `ip:${this.getClientIp(req)}`;
  }

  /**
   * Get the actual client IP (considering proxies)
   */
  private getClientIp(req: Record<string, any>): string {
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  /**
   * Detect if request is from a bot/crawler/scraper
   */
  private detectBot(userAgent: string): boolean {
    const lowerUserAgent = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some((botPattern) => {
      try {
        const regex = new RegExp(botPattern, 'i');
        return regex.test(lowerUserAgent);
      } catch {
        return lowerUserAgent.includes(botPattern);
      }
    });
  }

  /**
   * Override throttlerOptions to get custom throttle settings from decorators
   */
  protected getRequestResponse(context: ExecutionContext) {
    return super.getRequestResponse(context);
  }
}
