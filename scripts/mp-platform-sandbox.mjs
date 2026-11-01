#!/usr/bin/env node
/**
 * Guía y chequeo del cobro Nutridash en sandbox de Mercado Pago.
 * Nunca imprime secretos. Nunca llama a producción. Nunca usa un token APP_USR-.
 */
import { createHmac } from 'node:crypto';

const PRODUCTION_HOSTS = new Set([
  'plan-v-eight.vercel.app',
  'planv.app',
  'www.planv.app',
  'nutridash.app',
  'www.nutridash.app',
]);

function kindOf(name) {
  const raw = process.env[name];
  if (raw == null) return 'missing';
  const value = raw.trim();
  if (!value) return 'empty';
  if (value.startsWith('TEST-')) return 'test';
  if (value.startsWith('APP_USR-')) return 'production';
  return 'other';
}

function present(name) {
  return Boolean(process.env[name]?.trim());
}

function on(name) {
  return ['1', 'true', 'on'].includes((process.env[name] ?? '').trim().toLowerCase());
}

function printGuide() {
  console.log(`Cobro Nutridash · prueba en sandbox de Mercado Pago
====================================================

Esto cobra a la nutricionista (Nutridash), no a la paciente.
Solo sandbox: usuarios de prueba y token TEST-. Jamás un cobro real.

Variables que tiene que tener el servidor local (nunca las pegues acá):
  MP_PLATFORM_ACCESS_TOKEN     token TEST- de la aplicación de prueba
  MP_PLATFORM_WEBHOOK_SECRET   el mismo secreto de firma de esa app
  PLATFORM_BILLING_ENABLED=1
  PLATFORM_BILLING_SANDBOX=1   rechaza cualquier token que no sea TEST-
  PUBLIC_SITE_URL              https local o un túnel, no el sitio de producción

Si falta el token TEST-, no se inventa ni se usa otro. Cargalo en
https://www.mercadopago.com.ar/developers/panel/app (credenciales de prueba)
y en Usuarios de prueba creá un vendedor y un comprador.

Prueba automática (sin Mercado Pago real):
  npm test -- server/billing-platform/sandbox-flow.test.ts server/billing-platform/state.test.ts server/billing-platform/routes.test.ts

Prueba manual, cuando existan TEST- y un servidor local:

1. Levantá la API en local. No uses la web ni la API de producción.
2. Entrá con una nutricionista de prueba (no una cuenta real de pago).
3. En Ajustes elegí Arranque mensual. Tiene que abrir el checkout de sandbox.
4. Pagá con el comprador de prueba y una tarjeta de prueba aprobada.
5. Mercado Pago tiene que avisar a /api/public/billing/mp/webhook
   (con y sin barra final). La firma inválida responde 401.
6. GET /api/billing/plan tiene que decir authorized / Al día.
7. Simulá un rechazo (tarjeta de prueba rechazada o aviso firmado
   con status rejected). El plan queda en deuda, con 30 días de gracia.
8. Al cumplir los 30 días el panel pasa a solo lectura. La paciente
   sigue viendo sus datos y los mensajes.

Este script:
  npm run mp:sandbox              guía y chequeo de nombres (sin valores)
  npm run mp:sandbox -- --check   sale 0 si hay TEST-; 2 si falta; 3 si hay APP_USR-
  npm run mp:sandbox -- --simulate-webhook --url http://127.0.0.1:3001
                                 manda un aviso firmado SOLO a localhost
`);
}

function printCheck() {
  const platformToken = kindOf('MP_PLATFORM_ACCESS_TOKEN');
  const testNamed = kindOf('MP_TEST_ACCESS_TOKEN');
  const sellerNamed = kindOf('MP_TESTSELLER_ACCESS_TOKEN');
  const lines = [
    `MP_PLATFORM_ACCESS_TOKEN: ${platformToken}`,
    `MP_PLATFORM_WEBHOOK_SECRET: ${present('MP_PLATFORM_WEBHOOK_SECRET') ? 'present' : 'missing'}`,
    `PLATFORM_BILLING_ENABLED: ${on('PLATFORM_BILLING_ENABLED') ? 'on' : 'off'}`,
    `PLATFORM_BILLING_SANDBOX: ${on('PLATFORM_BILLING_SANDBOX') ? 'on' : 'off'}`,
    `PUBLIC_SITE_URL: ${present('PUBLIC_SITE_URL') ? 'present' : 'missing'}`,
    `MP_TEST_ACCESS_TOKEN: ${testNamed} (no se usa si no es TEST-)`,
    `MP_TESTSELLER_ACCESS_TOKEN: ${sellerNamed} (no se usa si no es TEST-)`,
  ];
  for (const line of lines) console.log(line);

  if (platformToken === 'production' || testNamed === 'production' || sellerNamed === 'production') {
    console.error('Hay un token APP_USR- a la vista. Este script no lo usa. Cargá uno TEST- en MP_PLATFORM_ACCESS_TOKEN.');
    return 3;
  }
  if (platformToken !== 'test') {
    console.error('Falta MP_PLATFORM_ACCESS_TOKEN con prefijo TEST-. No se prueba el checkout real de Mercado Pago.');
    return 2;
  }
  if (!present('MP_PLATFORM_WEBHOOK_SECRET')) {
    console.error('Falta MP_PLATFORM_WEBHOOK_SECRET. Se pueden correr los tests simulados, no el aviso real.');
    return 2;
  }
  console.log('Credenciales de sandbox listas para una prueba local. No las copies al chat ni al repo.');
  return 0;
}

function refuseRemote(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return 'La dirección del aviso no es válida.'; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'Solo http o https.';
  const host = parsed.hostname.toLowerCase();
  if (PRODUCTION_HOSTS.has(host) || host.endsWith('.railway.app') && !host.includes('localhost')) {
    return 'Esa dirección parece producción. Este script solo habla con localhost.';
  }
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
    return 'El aviso simulado solo se manda a localhost.';
  }
  return null;
}

function webhookUrl(base) {
  const trimmed = base.replace(/\/+$/, '');
  return trimmed.endsWith('/api/public/billing/mp/webhook')
    ? trimmed
    : `${trimmed}/api/public/billing/mp/webhook`;
}

function sign(id, requestId, secret, now = Date.now()) {
  const ts = String(Math.floor(now / 1000));
  const mac = createHmac('sha256', secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return { ts, signature: `ts=${ts},v1=${mac}` };
}

async function simulateWebhook(baseUrl) {
  const refused = refuseRemote(baseUrl);
  if (refused) {
    console.error(refused);
    return 3;
  }
  const secret = process.env.MP_PLATFORM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('Falta MP_PLATFORM_WEBHOOK_SECRET para firmar el aviso. No se inventa.');
    return 2;
  }
  const url = webhookUrl(baseUrl);
  const id = '88';
  const requestId = `sandbox-${Date.now()}`;
  const { signature } = sign(id, requestId, secret);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': requestId,
      'x-signature': signature,
    },
    body: JSON.stringify({ type: 'payment', action: 'payment.updated', data: { id } }),
  });
  console.log(`POST ${url} → ${response.status}`);
  if (response.status === 401) console.log('La firma no coincidió con el secreto del servidor.');
  if (response.status === 404) console.log('El cobro está apagado (PLATFORM_BILLING_ENABLED).');
  if (response.status === 501) console.log('Falta el secreto o el token TEST- en el servidor.');
  if (response.status === 503) console.log('Mercado Pago no contestó (esperado si no hay token TEST- o el pago 88 no existe).');
  if (response.status === 200) console.log('El servidor aceptó el aviso firmado. Revisá el plan de la nutricionista.');
  return response.status === 200 || response.status === 503 ? 0 : 1;
}

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const simulate = args.includes('--simulate-webhook');
const urlFlag = args.indexOf('--url');
const url = urlFlag >= 0 ? args[urlFlag + 1] : 'http://127.0.0.1:3001';

if (!checkOnly && !simulate) {
  printGuide();
  process.exit(printCheck());
}
if (checkOnly) process.exit(printCheck());
process.exit(await simulateWebhook(url));
