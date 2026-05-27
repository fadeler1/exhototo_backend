Exportación desde phpMyAdmin → migración a MongoDB
==================================================

1. En phpMyAdmin, selecciona la base ctr17658_EXHORTO
2. Para cada tabla, pestaña "Exportar":
   - Formato: CSV
   - Columnas: todas
   - Incluir nombres de columnas en la primera fila: SÍ

3. Guarda los archivos aquí con estos nombres exactos:
   - USUARIO.csv
   - EXHORTO.csv
   - DILIGENCIA.csv
   - BOLETA_RECEPTOR.csv
   - BOLETA_HONORARIO.csv

4. Desde la raíz del proyecto:
   npm run migrate:csv:dry    (simular)
   npm run migrate:csv        (migrar)
   npm run migrate:csv -- --clear --users --force-users   (reimportar todo)

Los CSV no se suben a git (están en .gitignore).
