import { BadRequestException, type ValidationError } from '@nestjs/common';

export class RequestValidationException extends BadRequestException {
  constructor(readonly errors: ValidationError[]) {
    super('common.VALIDATION_FAILED');
  }
}
