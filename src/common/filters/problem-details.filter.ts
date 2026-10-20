import { STATUS_CODES } from 'node:http';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  type ValidationError,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PROBLEM_JSON } from '@/common/constants/http.constants';
import { DEFAULT_LANGUAGE } from '@/common/constants/i18n.constants';
import { RequestValidationException } from '@/common/filters/request-validation.exception';
import type {
  ProblemDetails,
  ProblemDetailsFieldError,
} from '@/common/interfaces/problem-details.interface';

const TRANSLATION_KEY = /^[a-z]+\.[A-Z0-9_]+$/;
const ROUTE_NOT_FOUND = /^Cannot [A-Z]+ /;

interface ClientHttpError extends Error {
  status: number;
  expose: true;
}

function isClientHttpError(exception: unknown): exception is ClientHttpError {
  if (!(exception instanceof Error) || !('expose' in exception) || exception.expose !== true) {
    return false;
  }

  const { status } = exception as { status?: unknown };
  return typeof status === 'number' && status >= 400 && status < 500;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const lang = I18nContext.current(host)?.lang ?? DEFAULT_LANGUAGE;

    const status = this.status(exception);

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const problem: ProblemDetails = {
      type: 'about:blank',
      title: this.title(status, lang),
      status,
      detail: this.detail(exception, request, lang),
      instance: request.originalUrl ?? request.url,
    };

    if (exception instanceof RequestValidationException) {
      problem.errors = this.fieldErrors(exception.errors, lang);
    }

    response.status(status).type(PROBLEM_JSON).json(problem);
  }

  private status(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return isClientHttpError(exception) ? exception.status : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private title(status: number, lang: string): string {
    return this.translate(`common.HTTP.${status}`, lang) ?? STATUS_CODES[status] ?? 'Error';
  }

  private detail(exception: unknown, request: Request, lang: string): string {
    if (isClientHttpError(exception)) {
      return this.translate(`common.CLIENT_ERROR.${exception.status}`, lang) ?? exception.message;
    }

    if (!(exception instanceof HttpException)) {
      return this.translate('common.INTERNAL_ERROR', lang) ?? 'An unexpected error occurred.';
    }

    const message = this.message(exception);

    if (message === STATUS_CODES[exception.getStatus()]) {
      return this.title(exception.getStatus(), lang);
    }

    if (exception instanceof NotFoundException && ROUTE_NOT_FOUND.test(message)) {
      return (
        this.translate('common.ROUTE_NOT_FOUND', lang, {
          method: request.method,
          path: request.originalUrl ?? request.url,
        }) ?? message
      );
    }

    return (TRANSLATION_KEY.test(message) && this.translate(message, lang)) || message;
  }

  private message(exception: HttpException): string {
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return body;
    }

    const { message } = body as { message?: string | string[] };
    return Array.isArray(message) ? message.join(' ') : (message ?? exception.message);
  }

  private fieldErrors(
    errors: ValidationError[],
    lang: string,
    parent?: string,
  ): ProblemDetailsFieldError[] {
    return errors.flatMap((error) => {
      const field = parent ? `${parent}.${error.property}` : error.property;
      const messages = Object.entries(error.constraints ?? {}).map(([constraint, raw]) =>
        this.constraintMessage(constraint, raw, error.property, lang),
      );
      const own = messages.length > 0 ? [{ field, messages }] : [];

      return [...own, ...this.fieldErrors(error.children ?? [], lang, field)];
    });
  }

  private constraintMessage(
    constraint: string,
    raw: string,
    property: string,
    lang: string,
  ): string {
    if (constraint === 'whitelistValidation') {
      return this.translate('validation.PROPERTY_NOT_ALLOWED', lang, { property }) ?? raw;
    }

    const separator = raw.indexOf('|');
    const key = separator === -1 ? raw : raw.slice(0, separator);
    const args = separator === -1 ? {} : this.validationArgs(raw.slice(separator + 1));

    return (TRANSLATION_KEY.test(key) && this.translate(key, lang, { ...args, property })) || raw;
  }

  private validationArgs(json: string): Record<string, unknown> {
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private translate(key: string, lang: string, args?: Record<string, unknown>): string | undefined {
    const translated = this.i18n.translate(key, { lang, args, defaultValue: '' });
    return typeof translated === 'string' && translated !== '' ? translated : undefined;
  }
}
