import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import type { ApiDataResponseOptions } from '@/common/interfaces/api-data-response-options.interface';

export const ApiDataResponse = ({
  status = HttpStatus.OK,
  type,
  description,
}: ApiDataResponseOptions) =>
  applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        required: ['data'],
        properties: { data: { $ref: getSchemaPath(type) } },
      },
    }),
  );
