import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUrlDto {
  @ApiProperty({
    description: 'URL original a ser encurtada (http ou https).',
    example: 'https://www.example.com/some/long/url',
  })
  @IsString({ message: i18nValidationMessage('validation.URL_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.URL_REQUIRED') })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: i18nValidationMessage('validation.URL_INVALID') },
  )
  url: string;
}
