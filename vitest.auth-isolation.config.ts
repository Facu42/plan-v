import { defineConfig } from 'vitest/config';

// Configuración separada: las pruebas generales usan modo demo, esta debe pasar
// por Auth real y nunca permitir el cliente privilegiado como identidad de usuaria.
export default defineConfig({
  test: {
    include: ['server/security/signed-auth.local.test.ts'],
    env: { APP_MODE: 'staging', AI_MODE: 'disabled', TZ: 'UTC' },
  },
});
