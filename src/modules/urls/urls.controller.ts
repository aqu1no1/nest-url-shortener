import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SHORT_CODE_PATTERN } from '@/common/constants/short-code.constants';
import { ApiDataResponse } from '@/common/decorators/api-data-response.decorator';
import { ApiProblemResponse } from '@/common/decorators/api-problem-response.decorator';
import { ShortCodePipe } from '@/common/pipes/short-code.pipe';
import { CreateUrlDto } from '@/modules/urls/dto/create-url.dto';
import { UpdateUrlDto } from '@/modules/urls/dto/update-url.dto';
import { UrlResponseDto } from '@/modules/urls/dto/url-response.dto';
import { UrlStatsResponseDto } from '@/modules/urls/dto/url-stats-response.dto';
import { UrlsService } from '@/modules/urls/urls.service';

const SHORT_CODE_PARAM = {
  name: 'code',
  schema: { type: 'string', pattern: SHORT_CODE_PATTERN.source, example: 'abc123' },
} as const;

@ApiTags('URLs')
@ApiProblemResponse(
  HttpStatus.TOO_MANY_REQUESTS,
  'Muitas requisições. Tente novamente em instantes.',
)
@Controller('shorten')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Encurta uma URL' })
  @ApiDataResponse({ status: HttpStatus.CREATED, type: UrlResponseDto })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, 'A requisição contém campos inválidos.')
  @ApiProblemResponse(
    HttpStatus.PAYLOAD_TOO_LARGE,
    'O corpo da requisição excede o tamanho máximo permitido.',
  )
  create(@Body() dto: CreateUrlDto): Promise<UrlResponseDto> {
    return this.urlsService.create({ dto });
  }

  @Get(':code')
  @ApiOperation({ summary: 'Recupera a URL original e conta um acesso' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiDataResponse({ type: UrlResponseDto })
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  findOne(@Param('code', ShortCodePipe) code: string): Promise<UrlResponseDto> {
    return this.urlsService.findByCode({ shortCode: code });
  }

  @Put(':code')
  @ApiOperation({ summary: 'Atualiza a URL original mantendo o código' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiDataResponse({ type: UrlResponseDto })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, 'A requisição contém campos inválidos.')
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  @ApiProblemResponse(
    HttpStatus.PAYLOAD_TOO_LARGE,
    'O corpo da requisição excede o tamanho máximo permitido.',
  )
  update(
    @Param('code', ShortCodePipe) code: string,
    @Body() dto: UpdateUrlDto,
  ): Promise<UrlResponseDto> {
    return this.urlsService.update({ shortCode: code, dto });
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui a URL encurtada' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'URL excluída (sem corpo).' })
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  remove(@Param('code', ShortCodePipe) code: string): Promise<void> {
    return this.urlsService.remove({ shortCode: code });
  }

  @Get(':code/stats')
  @ApiOperation({ summary: 'Estatísticas da URL encurtada (não conta acesso)' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiDataResponse({ type: UrlStatsResponseDto })
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  getStats(@Param('code', ShortCodePipe) code: string): Promise<UrlStatsResponseDto> {
    return this.urlsService.getStats({ shortCode: code });
  }
}
