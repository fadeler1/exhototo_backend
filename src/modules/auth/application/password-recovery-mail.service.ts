import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { buildRecoveryEmailHtml } from './password-recovery-mail.template';

type MailProvider = 'resend' | 'smtp';

@Injectable()
export class PasswordRecoveryMailService {
  private readonly logger = new Logger(PasswordRecoveryMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendRecoveryCode(
    email: string,
    codigo: number,
    nombre: string,
  ): Promise<void> {
    const provider = this.resolveProvider();
    const from = this.configService.getOrThrow<string>('mail.from');
    const subject = 'Código de recuperación - Tramitador Exhorto';
    const html = buildRecoveryEmailHtml(codigo);

    try {
      if (provider === 'resend') {
        await this.sendViaResend(from, email, subject, html);
        return;
      }

      await this.sendViaSmtp(from, email, subject, html);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al enviar correo de recuperación: ${detail}`);
      throw new BadGatewayException(
        'No se pudo enviar el correo de recuperación. Intente más tarde.',
      );
    }
  }

  private resolveProvider(): MailProvider {
    const configured = this.configService.get<string>('mail.provider');
    const hasResend = Boolean(
      this.configService.get<string>('mail.resend.apiKey'),
    );
    const hasSmtp = Boolean(this.configService.get<string>('mail.smtp.host'));

    if (configured === 'resend') {
      if (!hasResend) {
        throw new InternalServerErrorException(
          'MAIL_PROVIDER=resend pero falta RESEND_API_KEY.',
        );
      }
      return 'resend';
    }

    if (configured === 'smtp') {
      if (!hasSmtp) {
        throw new InternalServerErrorException(
          'MAIL_PROVIDER=smtp pero falta SMTP_HOST.',
        );
      }
      return 'smtp';
    }

    if (hasResend) {
      return 'resend';
    }

    if (hasSmtp) {
      return 'smtp';
    }

    throw new InternalServerErrorException(
      'Correo no configurado: defina RESEND_API_KEY o SMTP_HOST.',
    );
  }

  private async sendViaResend(
    from: string,
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const apiKey = this.configService.getOrThrow<string>('mail.resend.apiKey');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend HTTP ${response.status}: ${body}`);
    }
  }

  private async sendViaSmtp(
    from: string,
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const host = this.configService.getOrThrow<string>('mail.smtp.host');
    const port = this.configService.getOrThrow<number>('mail.smtp.port');
    const user = this.configService.getOrThrow<string>('mail.smtp.user');
    const pass = this.configService.getOrThrow<string>('mail.smtp.password');
    const secure = this.resolveSmtpSecure(port);
    const requireTls = !secure && port === 587;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: requireTls,
      auth: { user, pass },
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({ from, to, subject, html });
  }

  /** 465 = SSL directo; 587 = STARTTLS (secure debe ser false). */
  private resolveSmtpSecure(port: number): boolean {
    const configured = this.configService.get<boolean | undefined>(
      'mail.smtp.secure',
    );
    if (configured !== undefined) {
      return configured;
    }
    return port === 465;
  }
}
