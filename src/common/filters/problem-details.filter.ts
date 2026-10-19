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

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const lang = I18nContext.current(host)?.lang ?? DEFAULT_LANGUAGE;

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

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

  private title(status: number, lang: string): string {
    return this.translate(`common.HTTP.${status}`, lang) ?? STATUS_CODES[status] ?? 'Error';
  }

  private detail(exception: unknown, request: Request, lang: string): string {
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

    const [key] = raw.split('|');
    return (TRANSLATION_KEY.test(key) && this.translate(key, lang, { property })) || raw;
  }

  private translate(key: string, lang: string, args?: Record<string, unknown>): string | undefined {
    const translated = this.i18n.translate(key, { lang, args, defaultValue: '' });
    return typeof translated === 'string' && translated !== '' ? translated : undefined;
  }
}
