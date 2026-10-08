import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('sample → scope → inline edit → alternate section → Markdown and PDF → history', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Use this brief' }),
  ).toHaveCount(4);
  await page.getByRole('button', { name: 'Use this brief' }).nth(3).click();
  await page.getByRole('button', { name: 'Forge scope', exact: true }).click();
  await expect(page.getByText('Reading brief', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Engagement title')).toHaveValue(
    'QBR narratives, grounded in data',
  );
  await page
    .getByLabel('Commercial question', { exact: true })
    .fill('Who signs off our pilot investment?');
  await expect(
    page.getByRole('article', { name: 'Live proposal preview' }),
  ).toContainText('Who signs off our pilot investment?');
  await page
    .getByLabel('Engagement title')
    .fill('A carefully bounded QBR pilot');
  await page
    .getByRole('button', { name: 'Regenerate Outcomes that matter' })
    .click();
  await expect(page.getByLabel('goals 1', { exact: true })).toHaveValue(
    'Demonstrate a measurable improvement in the agreed pilot workflow.',
  );
  await expect(page.getByLabel('Engagement title')).toHaveValue(
    'A carefully bounded QBR pilot',
  );
  await page.getByLabel('Cost driver 1', { exact: true }).fill('');
  await expect(
    page.getByRole('button', { name: 'Download PDF', exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel('Engagement size', { exact: true })
    .selectOption('Small');
  await page
    .getByLabel('Cost driver 1', { exact: true })
    .fill('A bounded export integration.');
  await expect(
    page.getByRole('button', { name: 'Download PDF', exact: true }),
  ).toBeEnabled();
  const mdDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  const md = await mdDownload;
  const text = await readFile((await md.path())!, 'utf8');
  expect(text).toContain('Who signs off our pilot investment?');
  expect(text).toContain('Steve Grady');
  expect(text).toContain('Synthetic demo — fictional customer');
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const pdf = await pdfDownload;
  const bytes = await readFile((await pdf.path())!);
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  expect(bytes.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1);
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page
    .getByRole('button')
    .filter({ hasText: 'A carefully bounded QBR pilot' })
    .click();
  await expect(
    page.getByLabel('Commercial question', { exact: true }),
  ).toHaveValue('Who signs off our pilot investment?');
  await page.reload();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'A carefully bounded QBR pilot' }),
  ).toBeVisible();
});
test('all samples and a free-text heuristic work through the API', async ({
  request,
}) => {
  const { readFileSync } = await import('node:fs');
  const index = JSON.parse(readFileSync('data/briefs/index.json', 'utf8'));
  for (const sample of index) {
    const r = await request.post('/api/forge', {
      data: { brief: readFileSync(`data/briefs/${sample.filename}`, 'utf8') },
    });
    expect(r.ok()).toBe(true);
    const b = await r.json();
    expect(b.scope.sector).toBe(sample.sector);
    expect(b.scope.outOfScope.length).toBeGreaterThan(0);
  }
  const r = await request.post('/api/forge', {
    data: {
      brief:
        'We need AI to triage support tickets but every decision must be reviewed.',
    },
  });
  expect((await r.json()).source).toBe('heuristic');
});
test('responsive intake and mobile proposal tab have no horizontal overflow', async ({
  page,
}) => {
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Forge scope', exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole('button', { name: 'Forge scope', exact: true }).click();
  await expect(page.getByLabel('Engagement title')).toBeVisible();
  await page
    .getByRole('tab', { name: 'Proposal preview', exact: true })
    .click();
  await expect(
    page.getByRole('article', { name: 'Live proposal preview' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test('empty, heuristic, accessibility and clear-history states', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Forge scope', exact: true }),
  ).toBeEnabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Paste the customer brief').fill('');
  await expect(
    page.getByRole('button', { name: 'Forge scope', exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel('Paste the customer brief')
    .fill(
      'We need an AI assistant to summarise support tickets. Staff must review the summaries.',
    );
  await page.getByRole('button', { name: 'Forge scope', exact: true }).click();
  await expect(
    page.getByText(
      'Demo mode — heuristic draft. Add an API key for a full AI forge.',
    ),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page
    .getByRole('button', { name: 'Clear history', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'A clean slate.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Brief intake', exact: true }).click();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'A clean slate.' }),
  ).toBeVisible();
});
