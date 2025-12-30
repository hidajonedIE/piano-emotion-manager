# Entornos de Desarrollo y Producción

## 🟢 Producción (LIVE MODE)
- **Branch**: `main`
- **URL**: https://pianoemotion.com
- **Stripe**: LIVE MODE (pagos reales)
- **Secret Key**: sk_live_... (configurada en Vercel)

## 🟡 Desarrollo (TEST MODE)
- **Branch**: `develop`
- **URL**: https://piano-emotion-manager-git-develop-jordi-navarretes-projects.vercel.app
- **Stripe**: TEST MODE (pagos simulados)
- **Secret Key**: sk_test_... (configurada en Vercel)
- **Tarjetas de prueba**: 4242 4242 4242 4242

## Flujo de Trabajo

1. Desarrolla y prueba en `develop` con TEST MODE
2. Cuando esté listo, haz merge a `main`
3. Vercel despliega automáticamente a producción

## Price IDs

### TEST MODE
- Professional: price_1SjwykDiwMrzMnxywKMWJddg (€30/año)
- Premium IA: price_1Sjx48DiwMrzMnxyB91U7HOs (€50/año)

### LIVE MODE
- Professional: price_1SjzWuDiwMrzMnxyFX5OBKLK (€30/año)
- Premium IA: price_1SjzdBDiwMrzMnxyg2KZwX8h (€50/año)
