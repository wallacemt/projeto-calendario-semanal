import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Body,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { updateProfileSchema, type UpdateProfileInput } from '@aniweek/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    // Pipe escopado ao @Body(), não @UsePipes() no método — @UsePipes roda
    // em TODOS os parâmetros do handler, inclusive @CurrentUser(). Como
    // updateProfileSchema não é .strict(), ele "validava" o AuthenticatedUser
    // também: aceitava (username bate no regex), descartava `id` (chave
    // desconhecida pro schema) e devolvia um user sem id pro resto do método.
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.users.updateProfile(user.id, body);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.users.deleteAccount(user.id);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_AVATAR_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.users.uploadAvatar(user.id, file);
  }
}
