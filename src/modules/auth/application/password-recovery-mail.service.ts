import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordRecoveryMailService {
  private readonly logger = new Logger(PasswordRecoveryMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendRecoveryCode(email: string, codigo: number): Promise<void> {
    const url = this.configService.getOrThrow<string>(
      'passwordRecovery.mailUrl',
    );
    const body = new URLSearchParams({
      EMAIL: email,
      CODIGO: String(codigo),
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      const cause =
        error instanceof Error && 'cause' in error
          ? String(error.cause)
          : String(error);
      this.logger.error(
        `No se pudo conectar con el servicio de correo (${url}): ${cause}`,
      );
      throw new BadGatewayException(
        'No se pudo enviar el correo de recuperación. Intente más tarde.',
      );
    }

    if (!response.ok) {
      this.logger.error(
        `Error al invocar ${url}: HTTP ${response.status}`,
      );
      throw new BadGatewayException(
        'No se pudo enviar el correo de recuperación',
      );
    }
  }
}
