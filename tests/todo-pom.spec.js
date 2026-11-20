
const { test, expect } = require('@playwright/test');
const { TodoPage } = require('../pages/TodoPage');

test.describe('Todo Application - POM Testing', () => {

    let todoPage;

    test.beforeEach(async ({ page }) => {

        todoPage = new TodoPage(page);

        await todoPage.navigateTo();

    });

    // TC001 - Add a todo
    test('TC001 - Add a new todo', async ({ page }) => {

        await todoPage.addTodo('Learn Playwright');

        await expect(
            todoPage.getTodoItem('Learn Playwright')
        ).toBeVisible();

    });

    // TC002 - Add multiple todos
    test('TC002 - Add multiple todos', async () => {

        await todoPage.addTodo('Learn JavaScript');

        await todoPage.addTodo('Learn Playwright');

        await todoPage.addTodo('Learn API Testing');

        await expect(todoPage.todoItems).toHaveCount(3);

    });

    // TC003 - Complete a todo
    test('TC003 - Complete a todo', async () => {

        await todoPage.addTodo('Complete QA Practice');

        await todoPage.completeTodo('Complete QA Practice');

        await expect(
            todoPage.getTodoItem('Complete QA Practice')
        ).toHaveClass(/completed/);

    });

    // TC004 - Edit a todo
    test('TC004 - Edit an existing todo', async () => {

        await todoPage.addTodo('Old Task');

        await todoPage.editTodo('Old Task', 'Updated Task');

        await expect(
            todoPage.getTodoItem('Updated Task')
        ).toBeVisible();

        await expect(
            todoPage.getTodoItem('Old Task')
        ).toHaveCount(0);

    });

    // TC005 - Delete a todo
    test('TC005 - Delete a todo', async () => {

        await todoPage.addTodo('Delete Task');

        await todoPage.deleteTodo('Delete Task');

        await expect(
            todoPage.getTodoItem('Delete Task')
        ).toHaveCount(0);

    });

    // TC006 - Clear completed todos
    test('TC006 - Clear completed todos', async () => {

        await todoPage.addTodo('Task One');

        await todoPage.addTodo('Task Two');

        await todoPage.completeTodo('Task One');

        await todoPage.clearCompletedTodos();

        await expect(
            todoPage.getTodoItem('Task One')
        ).toHaveCount(0);

        await expect(
            todoPage.getTodoItem('Task Two')
        ).toBeVisible();

    });

});
