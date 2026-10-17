import { expect, test } from '@playwright/test';
import { enterDemo, waitLoaded } from './helpers';

// Los recorridos comparten el servidor de prueba y siguen una historia: van en orden.
test.describe.configure({ mode: 'serial' });

test('1 · la nutricionista da de alta a una paciente nueva con invitación', async ({ page }) => {
  await enterDemo(page, '/crm/pacientes');
  await page.getByRole('button', { name: 'Nuevo paciente' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre completo').fill('Ana Prueba');
  await dialog.getByLabel('Email para la invitación').fill('ana.prueba@example.com');
  await dialog.getByLabel('Objetivo declarado').fill('Ordenar las comidas');
  await dialog.getByRole('button', { name: 'Crear alta' }).click();
  await expect(dialog).toHaveCount(0);
  const created = page.getByRole('row', { name: /Ana Prueba/ });
  await expect(created).toBeVisible();
  await expect(created).toContainText('Ordenar las comidas');
});

test('2 · la paciente completa su ficha de ingreso y la envía', async ({ page }) => {
  await enterDemo(page, '/app/ficha');
  await page.getByRole('button', { name: 'Editar mi ficha inicial' }).click();
  // La ficha puede abrir en el primer paso o donde quedó el borrador: se llega al paso de privacidad.
  const privacy = page.getByRole('heading', { name: 'Vos elegís qué compartir' });
  const start = page.getByRole('button', { name: 'Comenzar' });
  const back = page.getByRole('button', { name: 'Atrás' });
  const position = page.getByText(/^\d de 5$/);
  await expect(position).toBeVisible();
  for (let step = 0; step < 5 && !(await privacy.isVisible()); step += 1) {
    const before = await position.innerText();
    await ((await start.isVisible()) ? start : back).click();
    // Cada paso se guarda en el servidor: se espera el cambio antes de decidir el siguiente clic.
    await expect(position).not.toHaveText(before);
  }
  await expect(privacy).toBeVisible();
  const consent = page.getByLabel('Acepto compartir mis registros con mi nutricionista para el acompañamiento.');
  // El permiso se guarda en el servidor antes de quedar marcado.
  await consent.click();
  await expect(consent).toBeChecked();
  const next = page.getByRole('button', { name: 'Continuar' });
  await next.click();

  await expect(page.getByRole('heading', { name: 'Contanos sobre vos' })).toBeVisible();
  await page.getByLabel('¿Cómo preferís que te nombremos?').fill('Sofi');
  await page.getByRole('textbox', { name: /¿Qué te gustaría trabajar\?/ }).fill('Tener más energía a la tarde');
  await next.click();

  await expect(page.getByText('Tu día a día también cuenta')).toBeVisible();
  // Primero «Alimentos a evitar», después «Otras restricciones».
  await page.getByRole('button', { name: 'No tengo' }).first().click();
  await page.getByRole('button', { name: 'No tengo' }).last().click();
  await page.getByRole('button', { name: '6 vasos' }).click();
  await page.getByRole('button', { name: '7 h' }).click();
  await page.getByRole('button', { name: 'Media' }).click();
  await next.click();

  await expect(page.getByText('Revisá lo que vas a compartir')).toBeVisible();
  await expect(page.getByText('Sofi', { exact: true })).toBeVisible();
  await expect(page.getByText('Tener más energía a la tarde')).toBeVisible();
  await page.getByRole('button', { name: 'Enviar a mi nutricionista' }).click();
  await expect(page.getByText('Ya estás en tu espacio')).toBeVisible();

  await enterDemo(page, '/crm/pacientes');
  await page.getByRole('button', { name: 'Abrir ficha de Sofía R.' }).click();
  await page.getByRole('button', { name: 'Historia clínica', exact: true }).click();
  const intake = page.getByRole('main');
  await expect(intake.getByText('Tener más energía a la tarde')).toBeVisible();
  await expect(intake.getByText('Declaró que no tiene alergias.')).toBeVisible();
  await expect(intake.getByText('No hay faltantes de ingreso.', { exact: false })).toBeVisible();
});

test('3 · la nutricionista ajusta el plan y la paciente lo ve', async ({ page }) => {
  await enterDemo(page, '/crm/pacientes');
  await page.getByRole('button', { name: 'Abrir plan de Sofía R.' }).click();
  await page.getByLabel('Hora de Desayuno').fill('08:45');
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await page.getByRole('button', { name: 'Publicar v2' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Plan publicado. La paciente ve la versión revisada.' })).toBeVisible();
  await enterDemo(page, '/app/plan');
  await expect(page.getByText('Desayuno · 08:45')).toBeVisible();
  await expect(page.getByText('Tu plan cambió. Mirá qué es distinto.')).toBeVisible();
});

test('4 · la paciente registra una comida en el diario y la nutricionista la ve', async ({ page }) => {
  await enterDemo(page, '/app/diario');
  await page.getByRole('button', { name: 'Registrar comida, agua o descanso' }).click();
  await page.getByRole('dialog', { name: 'Registrar en mi diario' }).getByRole('button', { name: 'Registrar comida', exact: true }).click();
  const meal = page.getByRole('dialog', { name: 'Registrar comida' });
  await meal.getByRole('radio', { name: 'Describir' }).check();
  await meal.getByRole('radio', { name: 'Merienda' }).check();
  await meal.getByRole('textbox', { name: 'Contanos qué comiste' }).fill('Yogur natural con banana y nueces');
  await meal.getByRole('button', { name: 'Analizar con IA' }).click();
  await expect(meal.getByRole('heading', { name: 'Esto es lo que vemos' })).toBeVisible();
  await meal.getByRole('button', { name: 'Guardar comida' }).click();
  await expect(meal.getByRole('heading', { name: '¡Listo, Sofía!' })).toBeVisible();

  await enterDemo(page, '/crm/pacientes');
  await page.getByRole('button', { name: 'Abrir ficha de Sofía R.' }).click();
  await page.getByRole('button', { name: 'Revisar comidas' }).click();
  await waitLoaded(page);
  const row = page.getByRole('row', { name: /Yogur natural con banana y nueces/ });
  await expect(row).toBeVisible();
  await expect(row.getByRole('cell', { name: 'Pendiente', exact: true })).toBeVisible();
});

test('5 · la nutricionista revisa la comida y la paciente la ve confirmada', async ({ page }) => {
  await enterDemo(page, '/crm/diario?paciente=pat-sofia');
  const row = page.getByRole('row', { name: /Yogur natural con banana y nueces/ });
  await row.getByRole('button', { name: 'Revisar' }).click();
  const review = page.getByRole('dialog', { name: 'Revisar comida · Merienda' });
  await review.getByRole('button', { name: 'Confirmar sin cambios' }).click();
  await expect(review).toHaveCount(0);
  await expect(row.getByRole('cell', { name: 'Confirmada', exact: true })).toBeVisible();
  await expect(row.getByRole('cell', { name: '380 kcal' })).toBeVisible();

  await enterDemo(page, '/app/diario');
  const entry = page.getByRole('button', { name: 'Pedir corrección de Yogur natural con banana y nueces' });
  await expect(entry).toContainText('Revisada · IA');
  await expect(entry).toContainText('380');
});

test('6 · la nutricionista indica un recurso y a la paciente le llega el aviso hasta que lo lee', async ({ page }) => {
  await enterDemo(page, '/crm/pacientes');
  const assigned = await page.evaluate(async () => {
    const response = await fetch('/api/resources/assign', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resource_id: 'compras-desde-plan', patient_ids: ['pat-sofia'] }),
    });
    return response.status;
  });
  expect(assigned).toBe(200);

  await enterDemo(page, '/app/inicio');
  const bell = page.getByRole('button', { name: /^Ver avisos/ }).first();
  await bell.click();
  const notices = page.getByRole('dialog', { name: 'Avisos' });
  const notice = notices.getByRole('button', { name: /Tu nutricionista te indicó un recurso/ });
  await expect(notice).toBeVisible();
  await notice.click();
  await expect(page).toHaveURL(/\/app\/recursos#recurso=compras-desde-plan$/);

  await bell.click();
  await expect(notices.getByRole('button', { name: /Tu nutricionista te indicó un recurso/ })).toHaveCount(0);
});
