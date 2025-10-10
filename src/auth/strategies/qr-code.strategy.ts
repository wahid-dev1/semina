import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class QRCodeStrategy extends PassportStrategy(Strategy, 'qr-code') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const { qrCode } = req.body;
    if (!qrCode) {
      throw new UnauthorizedException('QR code is required');
    }

    const qr = await this.authService.validateQRCode(qrCode);
    if (!qr) {
      throw new UnauthorizedException('Invalid QR code');
    }

    return qr;
  }
}
