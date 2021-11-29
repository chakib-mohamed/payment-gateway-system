import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { MESSAGES } from '@nestjs/core/constants';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const type = host.getType();

    // Handle Rest exception throughout BaseExceptionFilter, otherwise let Graphql server handle the exception
    if (type === 'http') {
      return super.catch(exception, host);
    } else {
      throw exception;
    }
  }

  handleUnknownError(exception: any, host: ArgumentsHost, applicationRef) {
    // Return an unknown error message concatenated with a token, and log proper msg with the same token
    const ticket = uuidv4();
    const message = `(${ticket}) : ${MESSAGES.UNKNOWN_EXCEPTION_MESSAGE}`;
    const stack = `(${ticket}) : ${exception.message} \n ${exception.stack}`;

    super.handleUnknownError({ stack, statusCode: 500, message }, host, applicationRef);
  }
}
