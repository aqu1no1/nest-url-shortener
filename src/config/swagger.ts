import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  OPENAPI_JSON_PATH,
  OPENAPI_YAML_PATH,
  SWAGGER_PATH,
} from '@/common/constants/swagger.constants';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription(
      'API REST para encurtar URLs. Sucessos JSON retornam `{ "data": ... }`; erros seguem o RFC 9457 (Problem Details).',
    )
    .setVersion(process.env.npm_package_version ?? '0.1.0')
    .addTag('URLs', 'Encurtamento, consulta, atualização, exclusão e estatísticas de URLs')
    .addTag('Health', 'Disponibilidade da aplicação e do PostgreSQL')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    yamlDocumentUrl: OPENAPI_YAML_PATH,
  });
}
