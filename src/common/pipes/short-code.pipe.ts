import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { SHORT_CODE_PATTERN } from '@/common/constants/short-code.constants';

@Injectable()
export class ShortCodePipe implements PipeTransform<string, string> {
  constructor(private readonly i18n: I18nService) {}

  transform(value: string): string {
    if (!SHORT_CODE_PATTERN.test(value)) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: this.i18n.t('entities.URL') },
        }),
      );
    }

    return value;
  }
}
