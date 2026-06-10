export function buildRecoveryEmailHtml(nombre: string, codigo: number): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background-color:#ededed;font-family:Arial,Helvetica,sans-serif;">
    <table border="0" cellspacing="0" bgcolor="#ededed" width="100%">
      <tr>
        <td style="padding:24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#ffffff" width="600" style="max-width:600px;">
            <tr>
              <td style="padding:20px;color:#003366;font-size:12px;">
                <strong>Hola ${nombre},</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:0 20px 20px;color:#003366;font-size:11px;line-height:1.6;">
                <p>Recibimos una solicitud para restablecer su contraseña en Tramitador Exhorto.</p>
                <p>Su código de verificación es:</p>
                <p style="font-size:24px;font-weight:bold;letter-spacing:4px;margin:16px 0;">${codigo}</p>
                <p>Ingrese este código en el sitio para crear una nueva contraseña.</p>
                <p>Si usted no solicitó este cambio, puede ignorar este correo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
