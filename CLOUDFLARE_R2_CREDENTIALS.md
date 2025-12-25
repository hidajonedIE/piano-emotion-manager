# Credenciales de Cloudflare R2 - Piano Emotion Manager

**IMPORTANTE**: Estas credenciales son sensibles. NO las subas a repositorios públicos.

## Datos de la Cuenta

| Variable | Valor |
|----------|-------|
| **Account ID** | `9585f80d056852c84eca0a33280bbe06` |
| **Bucket Name** | `piano-emotion-storage` |

## Credenciales S3 (para la aplicación)

| Variable | Valor |
|----------|-------|
| **Access Key ID** | `c3ee6ad52240c53813353aae4c0e3aa0` |
| **Secret Access Key** | `5d790fbab744d724ce4cb6d5039fa30e944c33a4c2b7f540892505a8f008ecc1` |

## Endpoints S3

| Región | Endpoint |
|--------|----------|
| **Default** | `https://9585f80d056852c84eca0a33280bbe06.r2.cloudflarestorage.com` |
| **European Union (EU)** | `https://9585f80d056852c84eca0a33280bbe06.eu.r2.cloudflarestorage.com` |

## Variables de Entorno para Vercel

Añade estas variables en Vercel (Settings → Environment Variables):

```
R2_ACCOUNT_ID=9585f80d056852c84eca0a33280bbe06
R2_ACCESS_KEY_ID=c3ee6ad52240c53813353aae4c0e3aa0
R2_SECRET_ACCESS_KEY=5d790fbab744d724ce4cb6d5039fa30e944c33a4c2b7f540892505a8f008ecc1
R2_BUCKET_NAME=piano-emotion-storage
R2_ENDPOINT=https://9585f80d056852c84eca0a33280bbe06.r2.cloudflarestorage.com
```

## Token API

| Campo | Valor |
|-------|-------|
| **Token Name** | `piano-emotion-manager-token` |
| **Permissions** | Object Read & Write |
| **Buckets** | All R2 buckets on this account |
| **Token Value** | `jwjWILKQ3412Vw8YbrCEBm-vtwIqe96gE3SQLTlL` |

## Notas de Seguridad

1. Estas credenciales se muestran UNA SOLA VEZ después de crear/regenerar el token
2. Si las pierdes, necesitarás hacer "Roll" del token para generar nuevas
3. El Secret Access Key debe mantenerse en secreto absoluto
4. Usa variables de entorno, NUNCA hardcodees estas credenciales en el código
