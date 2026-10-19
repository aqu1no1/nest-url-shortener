import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable, map } from 'rxjs';
import { SKIP_RESPONSE_ENVELOPE } from '@/common/constants/http.constants';
import type { ApiResponse } from '@/common/interfaces/api-response.interface';

const ENVELOPE_KEYS = new Set(['data', 'meta']);

const isEnvelope = (body: unknown): body is ApiResponse<unknown> =>
  typeof body === 'object' &&
  body !== null &&
  !Array.isArray(body) &&
  'data' in body &&
  Object.keys(body).every((key) => ENVELOPE_KEYS.has(key));

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_ENVELOPE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip || context.getType() !== 'http') {
      return next.handle();
    }

    return next
      .handle()
      .pipe(
        map((body: unknown) =>
          body === undefined || body instanceof StreamableFile || isEnvelope(body)
            ? body
            : { data: body },
        ),
      );
  }
}
