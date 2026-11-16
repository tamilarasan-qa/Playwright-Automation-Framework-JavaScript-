
class TodoPage {

    constructor(page) {
        this.page = page;

        this.todoInput = page.getByPlaceholder(
            'What needs to be done?'
        );

        this.todoItems = page.locator('.todo-list li');

        this.todoCount = page.locator('.todo-count');

        this.clearCompletedButton = page.locator(
            'button.clear-completed'
        );
    }

    async navigateTo() {
        await this.page.goto('https://demo.playwright.dev/todomvc/#/');
    }

    async addTodo(todoName) {
        await this.todoInput.fill(todoName);
        await this.todoInput.press('Enter');
    }

    getTodoItem(todoName) {
        return this.todoItems.filter({
            hasText: todoName
        });
    }

    async completeTodo(todoName) {
        const todo = this.getTodoItem(todoName);
        await todo.locator('.toggle').check();
    }

    async editTodo(oldName, newName) {
        const todo = this.getTodoItem(oldName);

        await todo.locator('label').dblclick();

        const editInput = todo.locator('input.edit');

        await editInput.fill(newName);
        await editInput.press('Enter');
    }

    async deleteTodo(todoName) {
        const todo = this.getTodoItem(todoName);

        await todo.hover();
        await todo.locator('button.destroy').click();
    }

    async clearCompletedTodos() {
        await this.clearCompletedButton.click();
    }
}

module.exports = { TodoPage };
