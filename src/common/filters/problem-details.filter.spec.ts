import {
  type ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  type ValidationError,
} from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PROBLEM_JSON } from '@/common/constants/http.constants';
import { ProblemDetailsFilter } from '@/common/filters/problem-details.filter';
import { RequestValidationException } from '@/common/filters/request-validation.exception';

const translations: Record<string, string> = {
  'common.HTTP.400': 'Requisição inválida',
  'common.HTTP.404': 'Não encontrado',
  'common.HTTP.413': 'Conteúdo muito grande',
  'common.HTTP.429': 'Muitas requisições',
  'common.HTTP.500': 'Erro interno do servidor',
  'common.HTTP.503': 'Serviço indisponível',
  'common.VALIDATION_FAILED': 'A requisição contém campos inválidos.',
  'common.INTERNAL_ERROR': 'Ocorreu um erro inesperado.',
  'common.ROUTE_NOT_FOUND': 'A rota {method} {path} não existe.',
  'common.CLIENT_ERROR.413': 'O corpo da requisição excede o tamanho máximo permitido.',
  'common.TOO_MANY_REQUESTS': 'Muitas requisições. Tente novamente em instantes.',
  'validation.URL_INVALID': 'url deve ser uma URL válida com http ou https.',
  'validation.URL_TOO_LONG': 'url deve ter no máximo {max} caracteres.',
  'validation.PROPERTY_NOT_ALLOWED': 'A propriedade {property} não é permitida.',
};

const i18n = {
  translate: vi.fn<(key: string, options?: { args?: Record<string, unknown> }) => string>(
    (key, options) =>
      (translations[key] ?? '').replace(/\{(\w+)\}/g, (_, name: string) =>
        String(options?.args?.[name] ?? ''),
      ),
  ),
} as unknown as I18nService;

const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), { status, statusCode: status, expose: true });

const createHost = (method = 'GET', url = '/shorten/abc123') => {
  const response = {
    status: vi.fn<(status: number) => unknown>().mockReturnThis(),
    type: vi.fn<(type: string) => unknown>().mockReturnThis(),
    json: vi.fn<(body: unknown) => unknown>().mockReturnThis(),
  };
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ method, url, originalUrl: url }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
};

describe('ProblemDetailsFilter', () => {
  let filter: ProblemDetailsFilter;

  beforeEach(() => {
    filter = new ProblemDetailsFilter(i18n);
  });

  it('responde application/problem+json mantendo a mensagem já traduzida', () => {
    const { host, response } = createHost();

    filter.catch(new NotFoundException('Não foi possível encontrar a URL.'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.type).toHaveBeenCalledWith(PROBLEM_JSON);
    expect(response.json).toHaveBeenCalledWith({
      type: 'about:blank',
      title: 'Não encontrado',
      status: 404,
      detail: 'Não foi possível encontrar a URL.',
      instance: '/shorten/abc123',
    });
  });

  it('lista os erros de validação por campo', () => {
    const { host, response } = createHost('POST', '/shorten');
    const errors: ValidationError[] = [
      {
        property: 'url',
        constraints: { isUrl: 'validation.URL_INVALID|{"value":"x"}' },
        children: [],
      },
      {
        property: 'extra',
        constraints: { whitelistValidation: 'property extra should not exist' },
        children: [],
      },
    ];

    filter.catch(new RequestValidationException(errors), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        title: 'Requisição inválida',
        detail: 'A requisição contém campos inválidos.',
        errors: [
          { field: 'url', messages: ['url deve ser uma URL válida com http ou https.'] },
          { field: 'extra', messages: ['A propriedade extra não é permitida.'] },
        ],
      }),
    );
  });

  it('interpola os argumentos de i18nValidationMessage', () => {
    const { host, response } = createHost('POST', '/shorten');
    const errors: ValidationError[] = [
      {
        property: 'url',
        constraints: {
          maxLength:
            'validation.URL_TOO_LONG|{"value":"https://x","constraints":[2048],"max":2048}',
        },
        children: [],
      },
    ];

    filter.catch(new RequestValidationException(errors), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [{ field: 'url', messages: ['url deve ter no máximo 2048 caracteres.'] }],
      }),
    );
  });

  it('respeita o status de erros 4xx do Express (http-errors)', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, response } = createHost('POST', '/shorten');

    filter.catch(httpError(413, 'request entity too large'), host);

    expect(response.status).toHaveBeenCalledWith(413);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 413,
        title: 'Conteúdo muito grande',
        detail: 'O corpo da requisição excede o tamanho máximo permitido.',
      }),
    );
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('usa a mensagem do http-errors quando não há tradução para o status', () => {
    const { host, response } = createHost('POST', '/shorten');

    filter.catch(httpError(415, 'unsupported charset "UTF-7"'), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 415, detail: 'unsupported charset "UTF-7"' }),
    );
  });

  it('trata como 500 erros com status que não devem ser expostos', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, response } = createHost();

    filter.catch(Object.assign(new Error('falha'), { status: 400, expose: false }), host);

    expect(response.status).toHaveBeenCalledWith(500);
    log.mockRestore();
  });

  it('traduz mensagens no formato namespace.CHAVE', () => {
    const { host, response } = createHost();

    filter.catch(new BadRequestException('common.VALIDATION_FAILED'), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 400, detail: 'A requisição contém campos inválidos.' }),
    );
  });

  it('traduz rota inexistente', () => {
    const { host, response } = createHost('GET', '/nada');

    filter.catch(new NotFoundException('Cannot GET /nada'), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 404, detail: 'A rota GET /nada não existe.' }),
    );
  });

  it('mantém mensagens que não são chaves de tradução', () => {
    const { host, response } = createHost('POST', '/shorten');

    filter.catch(new BadRequestException('Unexpected token } in JSON'), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 400, detail: 'Unexpected token } in JSON' }),
    );
  });

  it('mantém a mensagem de exceções HTTP 5xx lançadas de propósito', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, response } = createHost('GET', '/health');

    filter.catch(new ServiceUnavailableException('O banco de dados está indisponível.'), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 503,
        title: 'Serviço indisponível',
        detail: 'O banco de dados está indisponível.',
      }),
    );
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it('traduz a mensagem padrão de exceções sem mensagem própria', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, response } = createHost();

    filter.catch(new InternalServerErrorException(), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, detail: 'Erro interno do servidor' }),
    );
    log.mockRestore();
  });

  it('esconde detalhes de erros inesperados e registra o erro', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, response } = createHost();

    filter.catch(new Error('senha do banco vazou'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        title: 'Erro interno do servidor',
        detail: 'Ocorreu um erro inesperado.',
      }),
    );
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
