# Playwright MCP – JavaScript Project Context (With POM)

## 1. Project Overview

This project uses Playwright MCP and JavaScript for web application testing and browser automation.

The objective is to perform functional testing, UI validation, API testing, regression testing, and end-to-end testing.

**Architecture:** Use the Page Object Model (POM) to separate page locators/actions from test scenarios.

**Important distinction:**
- Playwright MCP is used by an AI assistant to inspect and interact with the browser.
- Playwright Test is used to write, organize, and execute repeatable automated tests.
- Use both where appropriate. MCP browser interactions do not automatically create or execute Playwright Test cases.

## 2. Technology Stack

- Language: JavaScript
- Runtime: Node.js
- Browser automation: Playwright
- MCP server: `@playwright/mcp`
- Test runner: `@playwright/test`
- Design pattern: Page Object Model (POM)
- API testing: Playwright `APIRequestContext`
- Assertions: Playwright `expect`
- Reporting: Playwright HTML Reporter
- Version control: Git and GitHub
- CI: GitHub Actions (optional)

## 3. Playwright MCP Configuration

For a VS Code MCP configuration, create `.vscode/mcp.json`:

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Use the MCP configuration format required by your chosen MCP client. Restart or reload the MCP client after changing its configuration.

Official guide: https://playwright.dev/docs/getting-started-mcp

## 4. Installation

Initialize the project and install Playwright Test:

```bash
npm init -y
npm install --save-dev @playwright/test
npx playwright install
```

The MCP server can be launched by the MCP client using the configuration above. It does not replace the Playwright Test package.

## 5. Recommended Project Structure

```text
Playwright-MCP-JS/
├── .vscode/
│   └── mcp.json
├── context.md
├── package.json
├── playwright.config.js
├── pages/
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   └── EmployeePage.js
├── tests/
│   ├── login.spec.js
│   ├── dashboard.spec.js
│   ├── employee.spec.js
│   └── api.spec.js
├── test-data/
│   └── testData.json
├── utils/
│   └── testHelpers.js
├── screenshots/
└── playwright-report/
```

Keep page-specific locators and actions in `pages/`. Keep test scenarios and assertions in `tests/`.

## 6. Coding Standards

1. Always use JavaScript.
2. Use `async/await` for asynchronous operations.
3. Follow Page Object Model.
4. Keep locators and reusable page actions inside page classes.
5. Keep test scenarios and assertions inside spec files.
6. Use meaningful test and method names.
7. Avoid duplicate code.
8. Use reusable helper functions only when they provide clear value.
9. Prefer Playwright web-first assertions.
10. Avoid fixed waits such as `waitForTimeout()` unless there is a specific justified reason.
11. Do not hardcode credentials; use environment variables or secure test configuration.
12. Keep tests independent and clean up test data where appropriate.

## 7. Locator Strategy

Prefer locators in this order:

1. `getByRole()`
2. `getByLabel()`
3. `getByPlaceholder()`
4. `getByText()`
5. `getByTestId()`
6. CSS selectors
7. XPath only when necessary

Examples:

```javascript
page.getByRole('button', { name: 'Login' });
page.getByLabel('Email');
page.getByPlaceholder('Enter password');
page.getByText('Welcome');
page.getByTestId('save-button');
page.locator('#username');
page.locator('//button[@type="submit"]');
```

When using Playwright MCP, inspect the page and its accessibility snapshot before choosing locators. Prefer stable, unique locators.

## 8. Page Object Model Guidelines

Each page class should:
- Store the page instance.
- Define locators for that page.
- Provide methods for meaningful user actions.
- Avoid putting test-specific assertions in page classes unless they represent a reusable page-level check.
- Avoid duplicating locators across tests.

### Example: `pages/LoginPage.js`

```javascript
class LoginPage {
    constructor(page) {
        this.page = page;
        this.emailInput = page.getByLabel('Email');
        this.passwordInput = page.getByLabel('Password');
        this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    async open() {
        await this.page.goto('/login');
    }

    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}

module.exports = { LoginPage };
```

### Example: `tests/login.spec.js`

```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

test('User can log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(
        process.env.TEST_EMAIL,
        process.env.TEST_PASSWORD
    );

    await expect(page).toHaveURL(/dashboard/);
});
```

Use a configured `baseURL` so page classes can navigate using relative paths.

## 9. Playwright Configuration

Example `playwright.config.js`:

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.BASE_URL || 'https://example.com',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});
```

Adjust browser projects, retries, timeouts, and environment settings to match the application and CI environment.

## 10. Playwright MCP Browser Instructions

Use Playwright MCP tools to:
- Open and navigate the browser.
- Inspect the current page and accessibility information.
- Identify accessible names, roles, and element attributes.
- Click buttons and links.
- Fill input fields and select dropdown options.
- Handle dialogs and multiple tabs.
- Upload and download files.
- Capture screenshots.
- Inspect page state and browser console output when supported.
- Verify the result of important interactions.

Before interacting, inspect the current page. Do not guess selectors when inspection is available.

When MCP exploration identifies a locator or workflow, transfer the validated information into the appropriate page class and test file. Do not claim that a Playwright Test passed merely because an MCP browser action succeeded.

## 11. Test Coverage

### Login
- Valid username and password.
- Invalid username.
- Invalid password.
- Empty credentials.
- Password masking.
- Forgot password.
- Logout.
- Session timeout.

### Forms
- Mandatory field validation.
- Invalid input validation.
- Minimum and maximum character limits.
- Special characters.
- Duplicate record validation.
- Error and success messages.

### Dropdowns
- Verify available options.
- Verify default selection.
- Select a specific option.
- Verify selected value.
- Validate multi-select behavior where applicable.

### Tables
- Verify headers and row values.
- Search and filtering.
- Sorting.
- Pagination.
- Record details.
- Empty-state behavior.

### End-to-End and Regression
- Validate critical user journeys.
- Verify role-based access.
- Verify navigation between modules.
- Check that existing functionality remains stable after changes.

## 12. API Testing

Use Playwright `APIRequestContext` for API checks.

Validate:
- GET, POST, PUT, PATCH, and DELETE methods.
- HTTP status codes.
- Response body and data types.
- Response headers.
- Authentication and authorization.
- Required fields and negative cases.
- JSON schema where a schema is available.
- Response time against a defined requirement.

Example `tests/api.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test('GET employees returns success', async ({ request }) => {
    const response = await request.get('/api/employees');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toBeDefined();
});
```

Use a configured API base URL or a complete endpoint URL. Do not assume the example endpoint exists in the target application.

## 13. Test Execution Commands

Run all tests:

```bash
npx playwright test
```

Run one test file:

```bash
npx playwright test tests/login.spec.js
```

Run headed:

```bash
npx playwright test --headed
```

Run debug mode:

```bash
npx playwright test --debug
```

Run Chromium project:

```bash
npx playwright test --project=chromium
```

Open the HTML report:

```bash
npx playwright show-report
```

## 14. AI / MCP Working Instructions

Before starting a task:

1. Read this `context.md`.
2. Understand the requirement and identify the expected behavior.
3. Inspect the application with Playwright MCP before choosing locators.
4. Reuse the existing project structure and conventions.
5. Put page locators and reusable page actions in the relevant page class.
6. Put test scenarios and assertions in the relevant spec file.
7. Use JavaScript only.
8. Do not introduce another design pattern unless explicitly requested.
9. Do not create unnecessary files or duplicate page classes.
10. Execute the relevant Playwright Test command when execution is requested.
11. Report actual results only; never claim PASS without execution.
12. Capture screenshots or traces for failures when useful.
13. Do not change application source code unless explicitly requested.
14. Do not expose passwords, tokens, or other secrets.
15. Do not perform destructive actions on production data without explicit authorization.

## 15. Expected Test Report

For each test case, report:

| Field | Description |
|---|---|
| Test Case ID | Unique test identifier |
| Scenario | What is being tested |
| Steps | Actions performed |
| Expected Result | Required application behavior |
| Actual Result | Observed behavior |
| Status | PASS / FAIL / BLOCKED |
| Evidence | Screenshot, trace, or relevant error |
| Bug Details | Failure description, if applicable |

## 16. Final Project Rules

- JavaScript only.
- Playwright MCP for AI-assisted browser interaction.
- Playwright Test for repeatable automated test execution.
- Use Page Object Model.
- Keep page locators and actions in page classes.
- Keep test cases and assertions in spec files.
- Use stable locators and web-first assertions.
- Keep tests readable, independent, and maintainable.
- Follow functional testing, API testing, and QA best practices.

**Priority:** Correctness > Reliability > Maintainability > Simplicity.
