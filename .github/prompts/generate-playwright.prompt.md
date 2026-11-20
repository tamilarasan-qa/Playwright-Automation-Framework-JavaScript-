---
name: generate-playwright
description: Generate maintainable Playwright JavaScript automation from a requirement or manual test case.
agent: playwright-agent
---

Convert the provided requirement or test case into Playwright JavaScript.

Before coding:
1. Identify the test objective.
2. Identify required preconditions and test data.
3. Identify locator strategy.
4. Identify assertions.

Then provide:
- Complete Playwright test
- Required Page Object code when appropriate
- Test data/configuration notes
- Execution command
- Any assumptions

Prefer stable locators and web-first assertions. Avoid waitForTimeout() and hard-coded secrets.
