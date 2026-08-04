import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  activateThemeSchema,
  createThemeSchema,
  updateThemeSchema,
  type ActivateThemeInput,
  type CreateThemeInput,
  type UpdateThemeInput,
} from '@aniweek/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ThemesService } from './themes.service';

const MAX_BG_IMAGE_BYTES = 8 * 1024 * 1024;

@Controller('themes')
export class ThemesController {
  constructor(private readonly themes: ThemesService) {}

  @Get()
  @ApiOkResponse({ description: 'Todos os temas do usuário.' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.themes.findAll(user.id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Cria um tema custom.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createThemeSchema)) body: CreateThemeInput,
  ) {
    return this.themes.create(user.id, body);
  }

  // Rota literal — precisa vir antes de ':id' (mesma regra do
  // CalendarsController/AnimesController: senão o Nest tentaria casar
  // "active" com o parâmetro :id).
  @Get('active')
  @ApiOkResponse({
    description:
      'Tema efetivo (override manual, ou o pinado na estação atual, ou null).',
  })
  getActive(@CurrentUser() user: AuthenticatedUser) {
    return this.themes.getActive(user.id);
  }

  @Patch('active')
  @ApiOkResponse({
    description: 'Define o tema ativo. themeId=null volta pro modo "auto".',
  })
  setActive(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(activateThemeSchema)) body: ActivateThemeInput,
  ) {
    return this.themes.setActive(user.id, body);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Atualiza um tema.' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateThemeSchema)) body: UpdateThemeInput,
  ) {
    return this.themes.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.themes.remove(id, user.id);
  }

  @Post(':id/bg-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiCreatedResponse({ description: 'Upload da imagem de fundo do tema.' })
  uploadBgImage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_BG_IMAGE_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.themes.uploadBgImage(id, user.id, file);
  }
}
