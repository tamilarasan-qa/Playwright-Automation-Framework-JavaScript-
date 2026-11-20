# Playwright MCP – JavaScript Context

## 1. Project Overview

This project uses Playwright MCP and JavaScript for web application testing and browser automation.

The objective is to perform functional testing, UI validation, API testing, regression testing, and end-to-end testing.

**Important:** Do not use Page Object Model (POM). Write test scripts directly inside the test files.

## 2. Technology Stack

- Language: JavaScript
- Runtime: Node.js
- Browser Automation: Playwright
- MCP Server: `@playwright/mcp`
- Test Runner: `@playwright/test`
- API Testing: Playwright `APIRequestContext`
- Assertions: Playwright `expect`
- Reporting: Playwright HTML Reporter
- Version Control: Git and GitHub

## 3. Project Structure

Use the following structure:

```text
Playwright-MCP-JS/
├── context.md
├── package.json
├── playwright.config.js
├── tests/
│   ├── login.spec.js
│   ├── dashboard.spec.js
│   ├── employee.spec.js
│   ├── form-validation.spec.js
│   └── api.spec.js
├── test-data/
│   └── testData.json
├── screenshots/
└── reports/
```

Do not create `pages/` or page class files.

## 4. Coding Standards

1. Always use JavaScript.
2. Use `async/await`.
3. Do not use Page Object Model.
4. Write test scripts directly inside `tests/*.spec.js`.
5. Use meaningful test descriptions.
6. Avoid duplicate code where practical.
7. Use reusable helper functions only when necessary.
8. Use proper assertions.
9. Avoid hardcoded waits such as `waitForTimeout()`.
10. Keep scripts simple and readable.

## 5. Locator Strategy

Prefer locators in this order:

1. `getByRole()`
2. `getByLabel()`
3. `getByPlaceholder()`
4. `getByText()`
5. `getByTestId()`
6. CSS selectors
7. XPath (only when necessary)

Examples:

```javascript
page.getByRole('button', { name: 'Login' });
page.getByLabel('Email');
page.getByPlaceholder('Enter password');
page.getByText('Welcome');
page.locator('#username');
page.locator('//button[@type="submit"]');
```

Always inspect the page before identifying locators when using MCP.

## 6. Playwright MCP Browser Instructions

Use Playwright MCP to:

- Open the browser.
- Navigate to the application URL.
- Inspect page elements.
- Identify accessible locators.
- Click buttons and links.
- Enter text into fields.
- Select dropdown values.
- Handle alerts and dialogs.
- Handle multiple tabs.
- Upload and download files.
- Capture screenshots.
- Inspect console errors.
- Verify UI behavior.

Do not guess locators when browser inspection is available.

## 7. Test Script Guidelines

Write test scripts directly in the spec files.

Example: Login test

```javascript
const { test, expect } = require('@playwright/test');

test('Valid Login', async ({ page }) => {
    await page.goto('https://example.com/login');

    await page.getByLabel('Email').fill('test@gmail.com');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/dashboard/);
});
```

Do not create page classes or use POM.

## 8. Test Scenarios

### Login Testing

- Valid username and password.
- Invalid username.
- Invalid password.
- Empty username and password.
- Password masking.
- Forgot password.
- Logout functionality.
- Session timeout.

### Form Testing

- Mandatory field validation.
- Invalid input validation.
- Minimum and maximum character limits.
- Special character validation.
- Duplicate record validation.
- Error message validation.

### Dropdown Testing

- Verify dropdown options.
- Select a specific option.
- Verify default selection.
- Verify dropdown values.
- Validate multi-select dropdown.

### Table Testing

- Verify table headers.
- Verify row and column values.
- Search functionality.
- Sorting functionality.
- Pagination.
- Filter functionality.
- Verify specific record details.

## 9. API Testing

Use Playwright `APIRequestContext`.

Validate:

- GET, POST, PUT, PATCH, and DELETE.
- HTTP status codes.
- Response body.
- Response headers.
- Authentication.
- JSON schema.
- Response time where a defined requirement exists.

Example:

```javascript
const { test, expect } = require('@playwright/test');

test('Validate Employee API', async ({ request }) => {
    const response = await request.get(
        'https://api.example.com/employees'
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
});
```

## 10. Test Execution Commands

Run all tests:

```bash
npx playwright test
```

Run a specific test:

```bash
npx playwright test tests/login.spec.js
```

Run in headed mode:

```bash
npx playwright test --headed
```

Run in debug mode:

```bash
npx playwright test --debug
```

Run a specific browser project:

```bash
npx playwright test --project=chromium
```

View the HTML report:

```bash
npx playwright show-report
```

## 11. AI / MCP Instructions

When using Playwright MCP:

1. Read this `context.md` before starting any task.
2. Understand the requested testing requirement.
3. Inspect the application using MCP browser tools.
4. Identify the correct elements and locators.
5. Create test scripts using JavaScript.
6. Do not implement POM.
7. Do not create unnecessary files.
8. Execute tests when requested.
9. Validate actual results.
10. Capture screenshots for failures when appropriate.
11. Never report PASS without actual execution.
12. Do not modify application source code unless explicitly requested.
13. Never expose credentials, passwords, or authentication tokens.
14. Do not perform destructive actions on production data without authorization.

## 12. Expected Test Report

For each test case, provide:

| Field | Description |
|---|---|
| Test Case ID | Unique test ID |
| Scenario | What is being tested |
| Steps | Execution steps |
| Expected Result | Expected behavior |
| Actual Result | Observed behavior |
| Status | PASS / FAIL |
| Bug Details | Failure description |

## 13. Final Development Rules

- JavaScript only.
- Playwright MCP for browser interaction.
- Playwright Test for automated test execution.
- No Page Object Model.
- No unnecessary abstractions.
- Direct test scripts inside spec files.
- Simple, maintainable code.
- Follow functional testing and QA best practices.

**Priority:** Correctness > Maintainability > Simplicity.
