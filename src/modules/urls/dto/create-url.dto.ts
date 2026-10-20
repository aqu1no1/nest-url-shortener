import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const MAX_URL_LENGTH = 2048;

const WITHOUT_CONTROL_CHARACTERS = /^\P{Cc}*$/u;

export class CreateUrlDto {
  @ApiProperty({
    description: 'URL original a ser encurtada (http ou https).',
    example: 'https://www.example.com/some/long/url',
    maxLength: MAX_URL_LENGTH,
  })
  @IsString({ message: i18nValidationMessage('validation.URL_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.URL_REQUIRED') })
  @MaxLength(MAX_URL_LENGTH, {
    message: i18nValidationMessage('validation.URL_TOO_LONG', { max: MAX_URL_LENGTH }),
  })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: i18nValidationMessage('validation.URL_INVALID') },
  )
  @Matches(WITHOUT_CONTROL_CHARACTERS, { message: i18nValidationMessage('validation.URL_INVALID') })
  url: string;
}
