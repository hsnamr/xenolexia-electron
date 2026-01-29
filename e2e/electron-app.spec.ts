/**
 * UI / E2E tests for Xenolexia Electron app.
 * Requires desktop app to be built first: npm run electron:build (from packages/desktop)
 * or at least: cd packages/desktop && npm run build:assets
 */

import path from 'path';

import {test, expect} from '@playwright/test';
import {_electron as electron} from 'playwright';

function launchElectron() {
  const projectRoot = path.resolve(__dirname, '..');
  const desktopPath = path.join(projectRoot, 'packages', 'desktop');
  const mainPath = path.join(desktopPath, 'electron', 'main.js');
  return electron.launch({
    cwd: desktopPath,
    args: [mainPath],
    env: {...process.env, NODE_ENV: 'development'},
    timeout: 30000,
  });
}

test.describe('Electron App', () => {
  test('launches and shows app window', async () => {
    const electronApp = await launchElectron();
    try {
      const window = await electronApp.firstWindow({timeout: 15000});
      await expect(window).toBeTruthy();
      const title = await window.title();
      expect(title).toBeDefined();
      expect(title.length).toBeGreaterThanOrEqual(0);
    } finally {
      await electronApp.close();
    }
  });

  test('main window loads and contains #root with app content', async () => {
    const electronApp = await launchElectron();
    try {
      const window = await electronApp.firstWindow({timeout: 20000});
      await window.waitForLoadState('domcontentloaded').catch(() => {});
      await window.waitForTimeout(3000);
      const content = await window.content();
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
      const hasRoot = (await window.locator('#root').count()) > 0;
      expect(hasRoot).toBe(true);
      const root = window.locator('#root');
      await expect(root).toBeVisible();
    } finally {
      await electronApp.close();
    }
  });

  test('app shows Library or Onboarding content', async () => {
    const electronApp = await launchElectron();
    try {
      const window = await electronApp.firstWindow({timeout: 20000});
      await window.waitForLoadState('domcontentloaded').catch(() => {});
      await window.waitForTimeout(4000);
      const bodyText = await window.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      const hasLibraryOrOnboarding =
        (bodyText?.includes('Library') || bodyText?.includes('Welcome') || bodyText?.includes('Xenolexia')) ?? false;
      expect(hasLibraryOrOnboarding).toBe(true);
    } finally {
      await electronApp.close();
    }
  });
});
