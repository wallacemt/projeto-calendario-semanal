import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException
      ? extractMessage(exception)
      : 'Internal server error';
    const code = isHttpException ? HttpStatus[statusCode] : 'INTERNAL_ERROR';

    if (!isHttpException) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(statusCode).json({ statusCode, message, code });
  }
}

function extractMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response
  ) {
    const { message } = response as { message: string | string[] };
    return Array.isArray(message) ? message.join(', ') : message;
  }
  return exception.message;
}
