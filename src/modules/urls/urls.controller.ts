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
import { ApiDataResponse } from '@/common/decorators/api-data-response.decorator';
import { ApiProblemResponse } from '@/common/decorators/api-problem-response.decorator';
import { CreateUrlDto } from '@/modules/urls/dto/create-url.dto';
import { UpdateUrlDto } from '@/modules/urls/dto/update-url.dto';
import { UrlStatsResponse } from '@/modules/urls/responses/url-stats.response';
import { UrlResponse } from '@/modules/urls/responses/url.response';
import { UrlsService } from '@/modules/urls/urls.service';

@ApiTags('URLs')
@Controller('shorten')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Encurta uma URL' })
  @ApiDataResponse({ status: HttpStatus.CREATED, type: UrlResponse })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, 'A requisição contém campos inválidos.')
  create(@Body() dto: CreateUrlDto): Promise<UrlResponse> {
    return this.urlsService.create({ dto });
  }

  @Get(':code')
  @ApiOperation({ summary: 'Recupera a URL original e conta um acesso' })
  @ApiParam({ name: 'code', example: 'abc123' })
  @ApiDataResponse({ type: UrlResponse })
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  findOne(@Param('code') code: string): Promise<UrlResponse> {
    return this.urlsService.findByCode({ shortCode: code });
  }

  @Put(':code')
  @ApiOperation({ summary: 'Atualiza a URL original mantendo o código' })
  @ApiParam({ name: 'code', example: 'abc123' })
  @ApiDataResponse({ type: UrlResponse })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, 'A requisição contém campos inválidos.')
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  update(@Param('code') code: string, @Body() dto: UpdateUrlDto): Promise<UrlResponse> {
    return this.urlsService.update({ shortCode: code, dto });
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui a URL encurtada' })
  @ApiParam({ name: 'code', example: 'abc123' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'URL excluída (sem corpo).' })
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  remove(@Param('code') code: string): Promise<void> {
    return this.urlsService.remove({ shortCode: code });
  }

  @Get(':code/stats')
  @ApiOperation({ summary: 'Estatísticas da URL encurtada (não conta acesso)' })
  @ApiParam({ name: 'code', example: 'abc123' })
  @ApiDataResponse({ type: UrlStatsResponse })
  @ApiProblemResponse(HttpStatus.NOT_FOUND, 'Não foi possível encontrar a URL.')
  getStats(@Param('code') code: string): Promise<UrlStatsResponse> {
    return this.urlsService.getStats({ shortCode: code });
  }
}
