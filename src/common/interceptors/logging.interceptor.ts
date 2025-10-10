import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.connection.remoteAddress;

    const now = Date.now();
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip} - ${userAgent}`);
    
    if (Object.keys(body).length > 0) {
      console.log('Request body:', JSON.stringify(body, null, 2));
    }
    
    if (Object.keys(query).length > 0) {
      console.log('Query params:', JSON.stringify(query, null, 2));
    }
    
    if (Object.keys(params).length > 0) {
      console.log('Route params:', JSON.stringify(params, null, 2));
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const contentLength = response.get('content-length');
        
        console.log(
          `[${new Date().toISOString()}] ${method} ${url} ${statusCode} ${contentLength || 0}b - ${Date.now() - now}ms`
        );
      }),
    );
  }
}
