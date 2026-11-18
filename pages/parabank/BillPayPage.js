class BillPayPage {
    constructor(page) {
        this.page = page;
        this.payeeFields = {
            name: page.locator('[name="payee.name"]'),
            street: page.locator('[name="payee.address.street"]'),
            city: page.locator('[name="payee.address.city"]'),
            state: page.locator('[name="payee.address.state"]'),
            zipCode: page.locator('[name="payee.address.zipCode"]'),
            phoneNumber: page.locator('[name="payee.phoneNumber"]'),
            accountNumber: page.locator('[name="payee.accountNumber"]'),
            verifyAccount: page.locator('[name="verifyAccount"]')
        };
        this.amountInput = page.locator('[name="amount"]');
        this.fromAccountSelect = page.locator('[name="fromAccountId"]');
        this.sendPaymentButton = page.locator('input[value="Send Payment"]');
        this.paymentConfirmation = page.getByText('Bill Payment Complete', {
            exact: true
        });
        this.paymentErrors = page.locator('#rightPanel .error');
        this.serverError = page.getByText(
            'An internal error has occurred and has been logged.',
            { exact: true }
        );
    }

    async navigateToBillPay() {
        await this.page.getByRole('link', { name: 'Bill Pay', exact: true }).click();
    }

    async fillBillPaymentForm(payee, amount, sourceAccountId) {
        for (const [fieldName, field] of Object.entries(this.payeeFields)) {
            if (payee[fieldName] !== undefined) {
                await field.fill(payee[fieldName]);
            }
        }
        if (amount !== undefined) {
            await this.amountInput.fill(amount);
        }
        if (sourceAccountId !== undefined) {
            await this.fromAccountSelect.selectOption(sourceAccountId);
        }
    }

    async submitBillPayment() {
        await this.sendPaymentButton.click();
    }

    async waitForPaymentResult() {
        await this.page.waitForFunction(() => {
            const resultHeadings = [...document.querySelectorAll('#rightPanel h1')];
            return resultHeadings.some((heading) => {
                const text = heading.textContent.trim();
                return ['Bill Payment Complete', 'Error!'].includes(text) &&
                    heading.getClientRects().length > 0 &&
                    getComputedStyle(heading).visibility === 'visible';
            });
        });
    }

    async payBill(payee, amount, sourceAccountId) {
        await this.fillBillPaymentForm(payee, amount, sourceAccountId);
        await this.submitBillPayment();
    }
}

module.exports = { BillPayPage };
