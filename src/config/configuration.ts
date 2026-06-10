export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  mysql: {
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
    user: process.env.MYSQL_USER ?? '',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? '',
  },
  mail: {
    provider: process.env.MAIL_PROVIDER,
    from:
      process.env.MAIL_FROM ??
      'Tramitador Exhorto <no-reply@tramitadorexhorto.cl>',
    resend: {
      apiKey: process.env.RESEND_API_KEY,
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '465', 10),
      secure:
        process.env.SMTP_SECURE !== undefined
          ? process.env.SMTP_SECURE === 'true'
          : parseInt(process.env.SMTP_PORT ?? '465', 10) === 465,
      user: process.env.SMTP_USER?.trim(),
      password: process.env.SMTP_PASSWORD?.trim(),
    },
  },
});
