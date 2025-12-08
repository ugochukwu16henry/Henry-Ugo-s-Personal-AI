import { test, expect } from '@playwright/test'

test.describe('Code Editor', () => {
  test('should load Monaco Editor', async ({ page }) => {
    await page.goto('/')

    // Check if Monaco Editor is loaded
    const editor = page.locator('.monaco-editor')
    await expect(editor).toBeVisible()
  })

  test('should allow typing in the editor', async ({ page }) => {
    await page.goto('/')

    // Focus on editor and type
    await page.click('.monaco-editor')
    await page.keyboard.type('const hello = "world"')

    // Check if text appears (Monaco editor stores content in a textarea)
    const content = await page.locator('.monaco-editor textarea').inputValue()
    expect(content).toContain('hello')
  })
})

