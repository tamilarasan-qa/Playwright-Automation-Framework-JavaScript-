import { test, expect } from '@playwright/test';

const todoAppUrl = 'https://demo.playwright.dev/todomvc/';

async function addTodo(page, title) {
  const newTodo = page.getByRole('textbox', { name: 'What needs to be done?' });
  await newTodo.fill(title);
  await newTodo.press('Enter');
}

function todoRows(page) {
  return page.getByRole('list').first().getByRole('listitem');
}

test.beforeEach(async ({ page }) => {
  await page.goto(todoAppUrl);
});

test('shows the empty TodoMVC state', async ({ page }) => {
  await expect(page).toHaveTitle('React • TodoMVC');
  await expect(page.getByRole('heading', { name: 'todos' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'What needs to be done?' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Toggle Todo' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Active', exact: true })).toHaveCount(0);
});

test('adds todos with Enter and ignores empty or whitespace-only input', async ({ page }) => {
  await addTodo(page, 'Buy groceries');
  await expect(todoRows(page)).toHaveCount(1);
  await expect(todoRows(page).getByText('Buy groceries', { exact: true })).toBeVisible();
  await expect(page.getByText('1 item left')).toBeVisible();

  const newTodo = page.getByRole('textbox', { name: 'What needs to be done?' });
  await newTodo.fill('');
  await newTodo.press('Enter');
  await newTodo.fill('   ');
  await newTodo.press('Enter');

  await expect(todoRows(page)).toHaveCount(1);
  await expect(todoRows(page).getByText('Buy groceries', { exact: true })).toBeVisible();
});

test('completes and reactivates an individual todo while updating the count', async ({ page }) => {
  await addTodo(page, 'First task');
  await addTodo(page, 'Second task');

  const firstTask = todoRows(page).filter({ hasText: 'First task' });
  const firstToggle = firstTask.getByRole('checkbox', { name: 'Toggle Todo' });
  await firstToggle.check();

  await expect(firstToggle).toBeChecked();
  await expect(firstTask).toHaveClass(/completed/);
  await expect(page.getByText('1 item left')).toBeVisible();

  await firstToggle.uncheck();
  await expect(firstToggle).not.toBeChecked();
  await expect(firstTask).not.toHaveClass(/completed/);
  await expect(page.getByText('2 items left')).toBeVisible();
});

test('marks all todos complete and then active again', async ({ page }) => {
  await addTodo(page, 'First task');
  await addTodo(page, 'Second task');

  const markAll = page.getByRole('checkbox', { name: /Mark all as complete/ });
  await markAll.check();

  await expect(todoRows(page).getByRole('checkbox', { name: 'Toggle Todo' })).toHaveCount(2);
  await expect(todoRows(page).getByRole('checkbox', { name: 'Toggle Todo' }).nth(0)).toBeChecked();
  await expect(todoRows(page).getByRole('checkbox', { name: 'Toggle Todo' }).nth(1)).toBeChecked();
  await expect(page.getByText('0 items left')).toBeVisible();

  await markAll.uncheck();
  await expect(todoRows(page).getByRole('checkbox', { name: 'Toggle Todo' }).nth(0)).not.toBeChecked();
  await expect(todoRows(page).getByRole('checkbox', { name: 'Toggle Todo' }).nth(1)).not.toBeChecked();
  await expect(page.getByText('2 items left')).toBeVisible();
});

test('filters active and completed todos and returns to all todos', async ({ page }) => {
  await addTodo(page, 'Active task');
  await addTodo(page, 'Completed task');
  await todoRows(page).filter({ hasText: 'Completed task' })
    .getByRole('checkbox', { name: 'Toggle Todo' }).check();

  await page.getByRole('link', { name: 'Active', exact: true }).click();
  await expect(todoRows(page)).toHaveCount(1);
  await expect(todoRows(page).getByText('Active task', { exact: true })).toBeVisible();
  await expect(todoRows(page).getByText('Completed task', { exact: true })).toHaveCount(0);

  await page.getByRole('link', { name: 'Completed', exact: true }).click();
  await expect(todoRows(page)).toHaveCount(1);
  await expect(todoRows(page).getByText('Completed task', { exact: true })).toBeVisible();
  await expect(todoRows(page).getByText('Active task', { exact: true })).toHaveCount(0);

  await page.getByRole('link', { name: 'All', exact: true }).click();
  await expect(todoRows(page)).toHaveCount(2);
});

test('edits a todo and discards an edit with Escape', async ({ page }) => {
  await addTodo(page, 'Original title');

  const row = todoRows(page).filter({ hasText: 'Original title' });
  await row.getByText('Original title', { exact: true }).dblclick();

  const editor = page.getByRole('textbox', { name: 'Edit' });
  await editor.fill('Updated title');
  await editor.press('Enter');
  await expect(todoRows(page).getByText('Updated title', { exact: true })).toBeVisible();

  const updatedRow = todoRows(page).filter({ hasText: 'Updated title' });
  await updatedRow.getByText('Updated title', { exact: true }).dblclick();
  await page.getByRole('textbox', { name: 'Edit' }).fill('Discarded title');
  await page.getByRole('textbox', { name: 'Edit' }).press('Escape');

  await expect(todoRows(page).getByText('Updated title', { exact: true })).toBeVisible();
  await expect(todoRows(page).getByText('Discarded title', { exact: true })).toHaveCount(0);
});

test('removes a todo when its title is cleared during editing', async ({ page }) => {
  await addTodo(page, 'Remove me');

  const row = todoRows(page).filter({ hasText: 'Remove me' });
  await row.getByText('Remove me', { exact: true }).dblclick();
  const editor = page.getByRole('textbox', { name: 'Edit' });
  await editor.fill('');
  await editor.press('Enter');

  await expect(todoRows(page)).toHaveCount(0);
});

test('deletes a todo using its row delete button', async ({ page }) => {
  await addTodo(page, 'Delete me');
  await addTodo(page, 'Keep me');

  const rowToDelete = todoRows(page).filter({ hasText: 'Delete me' });
  await rowToDelete.hover();
  await rowToDelete.getByRole('button', { name: 'Delete' }).click();

  await expect(todoRows(page)).toHaveCount(1);
  await expect(todoRows(page).getByText('Keep me', { exact: true })).toBeVisible();
  await expect(todoRows(page).getByText('Delete me', { exact: true })).toHaveCount(0);
});

test('clears completed todos without removing active todos', async ({ page }) => {
  await addTodo(page, 'Completed task');
  await addTodo(page, 'Active task');
  await todoRows(page).filter({ hasText: 'Completed task' })
    .getByRole('checkbox', { name: 'Toggle Todo' }).check();

  await page.getByRole('button', { name: 'Clear completed' }).click();

  await expect(todoRows(page)).toHaveCount(1);
  await expect(todoRows(page).getByText('Active task', { exact: true })).toBeVisible();
  await expect(todoRows(page).getByText('Completed task', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Clear completed' })).toHaveCount(0);
});
