class TransferFundsPage {
    constructor(page) {
        this.page = page;
        this.amountInput = page.locator('#amount');
        this.fromAccountSelect = page.locator('#fromAccountId');
        this.toAccountSelect = page.locator('#toAccountId');
        this.transferButton = page.locator('input[value="Transfer"]');
        this.transferConfirmation = page.getByText('Transfer Complete!', { exact: true });
    }

    async navigateToTransferFunds() {
        await this.page.getByRole('link', {
            name: 'Transfer Funds',
            exact: true
        }).click();
    }

    async fillTransferForm(amount, sourceAccountId, destinationAccountId) {
        if (amount !== undefined) {
            await this.amountInput.fill(amount);
        }
        if (sourceAccountId !== undefined) {
            await this.fromAccountSelect.selectOption(sourceAccountId);
        }
        if (destinationAccountId !== undefined) {
            await this.toAccountSelect.selectOption(destinationAccountId);
        }
    }

    async submitTransfer() {
        await this.transferButton.click();
    }

    async transferFunds(amount, sourceAccountId, destinationAccountId) {
        await this.fillTransferForm(amount, sourceAccountId, destinationAccountId);
        await this.submitTransfer();
    }
}

module.exports = { TransferFundsPage };
