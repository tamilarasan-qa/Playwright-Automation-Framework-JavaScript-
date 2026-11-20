class ChecklistsPage {
    constructor(page) {
        this.page = page;
        this.checklistsHeading = page.getByRole('heading', {
            name: /^Manage all your Maintenance Checklists \(\d+\)$/
        });
        this.description = page.getByText(
            'Create Standard Maintenance Task or import your custom checklist template (.csv / .docx / .xlsx) files.',
            { exact: true }
        );
        this.searchInput = page.getByPlaceholder('Search checklists...');
        this.typeFilterButton = page.getByRole('button', {
            name: /^(All Types|Task Groups|Tasks|Checklists)$/
        });
        this.addButton = page.getByRole('button', {
            name: 'Add',
            exact: true
        });
        this.addTaskMenuItem = page.getByRole('menuitem', {
            name: 'Task',
            exact: true
        });
        this.addTaskHeading = page.getByRole('heading', {
            name: 'Add New Task',
            exact: true
        });
        this.viewDialog = page.getByRole('dialog', {
            name: 'View Checklist'
        });
        this.taskTitleInput = page.getByPlaceholder('Enter Title name');
        this.objectiveInput = page.getByPlaceholder('Enter Objective');
        this.equipmentTypeInput = page.getByPlaceholder('Enter equipment type');
        this.estimatedHoursInput = page.getByPlaceholder('HH').nth(0);
        this.estimatedMinutesInput = page.getByPlaceholder('HH').nth(1);
        this.instructionsInput = page.getByPlaceholder('Enter instructions');
        this.expectedResultInput = page.getByPlaceholder('Enter expected result');
        this.alternateActionInput = page.getByPlaceholder(
            'Enter alternate action'
        );
        this.addTaskButton = page.getByRole('button', {
            name: 'Add Task',
            exact: true
        });
        this.cancelButton = page.getByRole('button', {
            name: 'Cancel',
            exact: true
        });
        this.checklistsTable = page.getByRole('table');
        this.itemsPerPageSelector = page.getByRole('combobox').last();
        this.previousPageButton = page.getByRole('button', {
            name: 'Previous',
            exact: true
        });
        this.nextPageButton = page.getByRole('button', {
            name: 'Next',
            exact: true
        });
    }

    async navigateToChecklists() {
        await this.page.getByRole('button', {
            name: 'Checklist',
            exact: true
        }).first().click();
        await this.checklistsHeading.waitFor({ state: 'visible' });
        await this.checklistsTable.waitFor({ state: 'visible' });
    }

    async searchChecklists(query) {
        await this.searchInput.fill(query);
    }

    async openTypeFilter() {
        await this.typeFilterButton.click();
    }

    async selectType(typeName) {
        await this.openTypeFilter();
        const typeOption = typeName === 'All Types'
            ? this.page.getByRole('menuitem', { name: /All Types/ })
            : this.page.getByRole('menuitem', {
                name: typeName,
                exact: true
            });
        await typeOption.click();
    }

    async openNewTaskForm() {
        await this.addButton.click();
        await this.addTaskMenuItem.click();
        await this.addTaskHeading.waitFor({ state: 'visible' });
    }

    async openFirstChecklistActions() {
        const firstDataRow = this.checklistsTable.getByRole('row').nth(1);
        await firstDataRow.getByRole('button').last().click();
    }
}

module.exports = { ChecklistsPage };
