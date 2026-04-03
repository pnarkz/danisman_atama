import { expect, test } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:3000/api';

async function registerStudent(request, email, fullName, gano) {
  const response = await request.post(`${apiBaseUrl}/auth/register`, {
    data: {
      email,
      password: 'Temp1234!',
      role: 'ogrenci',
      full_name: fullName,
      gano,
      department_id: 1,
      entry_year: 2024,
    },
  });

  expect(response.ok()).toBeTruthy();
}

async function registerFaculty(request, email, fullName) {
  const response = await request.post(`${apiBaseUrl}/auth/register`, {
    data: {
      email,
      password: 'Temp1234!',
      role: 'hoca',
      full_name: fullName,
      department_id: 1,
      expertise_keywords: 'Yapay Zeka, Test Otomasyonu',
    },
  });

  expect(response.ok()).toBeTruthy();
}

async function login(page, email, password) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

test('admin can log in and run quota calculation', async ({ page }) => {
  await login(page, 'admin@ankara.edu.tr', 'admin123');

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Yerlestirme ve kullanici yonetimi' })).toBeVisible();
  await page.getByRole('button', { name: 'Kontenjanlari hesapla' }).click();
  await expect(page.getByText(/Kontenjanlar guncellendi/i)).toBeVisible();
});

test('student can log in and persist preferences', async ({ page, request }) => {
  const uniqueId = Date.now();
  const email = `e2e_ogrenci_${uniqueId}@ankara.edu.tr`;
  const fullName = `E2E Ogrenci ${uniqueId}`;

  await registerStudent(request, email, fullName, 3.42);
  await login(page, email, 'Temp1234!');

  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByRole('heading', { name: 'Aktif danismanlar' })).toBeVisible();

  const firstFacultyName = (await page.locator('.list-card h3').first().textContent())?.trim();
  expect(firstFacultyName).toBeTruthy();

  await page.getByRole('button', { name: 'Ekle' }).first().click();
  await page.getByRole('button', { name: 'Tercihleri kaydet' }).click();
  await expect(page.getByText(/Tercih listeniz kaydedildi/i)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Kayitli tercih listeniz' })).toBeVisible();
  await expect(page.locator('.preference-card')).toHaveCount(1);
  await expect(page.getByText(firstFacultyName)).toBeVisible();
});

test('faculty can log in and send a direct offer', async ({ page, request }) => {
  const uniqueId = Date.now();
  const studentEmail = `e2e_teklif_${uniqueId}@ankara.edu.tr`;
  const studentName = `E2E Teklif ${uniqueId}`;
  const facultyEmail = `e2e_hoca_${uniqueId}@ankara.edu.tr`;
  const facultyName = `E2E Hoca ${uniqueId}`;

  await registerStudent(request, studentEmail, studentName, 3.98);
  await registerFaculty(request, facultyEmail, facultyName);
  await login(page, facultyEmail, 'Temp1234!');

  await expect(page).toHaveURL(/\/faculty$/);
  await expect(page.getByRole('heading', { name: 'Danismanliginiz altindaki ogrenciler' })).toBeVisible();

  await page.locator('input[type="number"]').fill('3.98');
  await page.getByRole('button', { name: 'Filtrele' }).click();

  const targetCard = page.locator('.list-card', { hasText: studentName });
  await expect(targetCard).toBeVisible();
  await targetCard.getByRole('button', { name: 'Teklif gonder' }).click();
  await expect(page.getByText(new RegExp(`${studentName} icin dogrudan teklif gonderildi`, 'i'))).toBeVisible();
});
