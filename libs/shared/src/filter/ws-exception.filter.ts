import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';

export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient();

    if (exception.error?.length) {
      if (exception.error[0]?.children.length) {
        client.emit(
          'error',
          Object.values(exception.error[0].children[0].constraints)[0],
        );
      } else {
        client.emit('error', Object.values(exception.error[0].constraints)[0]);
      }
    } else {
      client.emit('error', exception.error);
    }
  }
}
