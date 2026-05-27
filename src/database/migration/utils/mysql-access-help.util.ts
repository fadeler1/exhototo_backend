export function printMysqlAccessDeniedHelp(): void {
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  MySQL rechazó la conexión remota (Access denied)                ║
╚══════════════════════════════════════════════════════════════════╝

En hosting compartido, MySQL suele aceptar solo conexiones desde el
mismo servidor (localhost). phpMyAdmin funciona porque corre EN el servidor;
tu Mac se conecta desde otra IP y el usuario no tiene permiso remoto.

Opciones:

1) Autorizar tu IP en el panel del hosting (cPanel / Plesk)
   - Busca: "MySQL remoto" / "Remote MySQL" / "Acceso remoto"
   - Agrega tu IP pública actual (la que ve el servidor, ej. 190.114.38.23)
   - Espera unos minutos y vuelve a ejecutar: npm run migrate:mysql

2) Túnel SSH (si tienes SSH al servidor)
   ssh -L 3307:127.0.0.1:3306 usuario@tu-servidor
   En .env: MYSQL_HOST=127.0.0.1  MYSQL_PORT=3307

3) Exportar CSV desde phpMyAdmin (recomendado si no hay acceso remoto)
   - Exportar tablas: EXHORTO, DILIGENCIA, BOLETA_RECEPTOR,
     BOLETA_HONORARIO, USUARIO (formato CSV)
   - Guardar en: data/mysql-export/
   - Ejecutar: npm run migrate:csv

Más info: data/mysql-export/README.txt
`);
}
