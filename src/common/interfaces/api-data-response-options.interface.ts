import type { HttpStatus, Type } from '@nestjs/common';

export interface ApiDataResponseOptions {
  status?: HttpStatus;
  type: Type<unknown>;
  description?: string;
}
