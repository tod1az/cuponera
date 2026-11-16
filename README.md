# Cuponera

Gestor de pasajes de cuponeras Turbus. Importa el PDF del comprobante, guarda
código y clave cifrados por usuario, permite copiarlos y marcar los usados.

Stack: Vite + React + Tailwind v4 · Convex · Convex Auth v2 (Google) · pdf.js · PWA.

## Desarrollo

```sh
pnpm install
pnpm dev:convex   # terminal 1: sincroniza convex/ con el deployment de dev
pnpm dev          # terminal 2: http://localhost:5173
pnpm test
```

## Variables de entorno (Convex)

| Variable | Descripción |
| --- | --- |
| `CUPONERA_MASTER_KEY` | 32 bytes aleatorios en base64. **No cambiarla**: sin ella no se pueden descifrar los pasajes. |
| `ALLOWED_REDIRECT_ORIGINS` | Orígenes del frontend separados por coma, ej. `http://localhost:5173,https://cuponera.vercel.app` |
| `AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET` | Credenciales OAuth de Google |

Generar una llave maestra:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Google OAuth

1. Google Cloud Console → APIs y servicios → Credenciales → Crear ID de cliente OAuth (Aplicación web).
2. URI de redireccionamiento autorizado: `https://<deployment>.convex.site/oauth/google/callback`.
3. `npx convex env set AUTH_GOOGLE_CLIENT_ID ...` y `npx convex env set AUTH_GOOGLE_CLIENT_SECRET ...`.

## Seguridad

- El PDF se lee en el navegador y **no se sube**. Nombre y RUT se descartan.
- Código y clave se cifran con AES-256-GCM. La llave de cada usuario se deriva
  con HKDF-SHA256 (llave maestra + userId) y nunca se guarda. El AAD ata cada
  dato cifrado al usuario y al pasaje.
- Las queries nunca devuelven datos cifrados. Los secretos se descifran en la
  action `secretos.revelar` (solo pasajes sin usar) y viven solo en memoria.
- Protege ante filtraciones de la base de datos y entre usuarios. Quien
  administre el deployment de Convex (y su llave maestra) sí podría descifrar.

## Deploy

- Backend: `npx convex deploy` (configurar las mismas variables en prod, con
  otra `CUPONERA_MASTER_KEY` y otras credenciales/redirect de Google).
- Frontend (Vercel): build command `npx convex deploy --cmd 'pnpm build'`,
  con `CONVEX_DEPLOY_KEY` de producción.
