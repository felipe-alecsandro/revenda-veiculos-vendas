import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class InternalTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = process.env.INTERNAL_API_TOKEN;
    const received = request.header('x-internal-token');
    if (!expected || received !== expected) {
      throw new UnauthorizedException('Invalid internal token.');
    }
    return true;
  }
}
