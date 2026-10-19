import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { PROBLEM_JSON } from '@/common/constants/http.constants';

export const ApiProblemResponse = (status: HttpStatus, description: string) =>
  ApiResponse({
    status,
    description,
    content: {
      [PROBLEM_JSON]: {
        schema: {
          type: 'object',
          required: ['type', 'title', 'status'],
          properties: {
            type: { type: 'string', example: 'about:blank' },
            title: { type: 'string', example: 'Não encontrado' },
            status: { type: 'integer', example: status },
            detail: { type: 'string', example: description },
            instance: { type: 'string', example: '/shorten/abc123' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'url' },
                  messages: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  });
