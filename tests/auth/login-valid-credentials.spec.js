import 'dotenv/config';
import { test } from '@playwright/test';
import { FitzdoLoginPage } from '../pages/FitzdoLoginPage';

function requireEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

test('TS-01: a user can log in with valid credentials', async ({ page }) => {
  const loginUrl = requireEnvironmentVariable('LOGIN_URL');
  const username = requireEnvironmentVariable('LOGIN_USERNAME');
  const password = requireEnvironmentVariable('LOGIN_PASSWORD');
  const loginPage = new FitzdoLoginPage(page);

  await loginPage.goto(loginUrl);
  await loginPage.login(username, password);
  await loginPage.expectAuthenticated();
});