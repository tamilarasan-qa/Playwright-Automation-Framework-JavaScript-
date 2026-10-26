import { test, expect } from '@playwright/test';
import 'dotenv/config';
import path from 'path';

// ============================================================
// ENV VALIDATION For Naukri
// ============================================================

if (!process.env.NAUKRI_EMAIL || !process.env.NAUKRI_PASSWORD) {
    throw new Error(
        'NAUKRI_EMAIL or NAUKRI_PASSWORD is missing in .env'
    );
}

test('Naukri Profile Update', async ({ page }) => {
    // ==========================================================
    // 1. LOGIN
    // ==========================================================

    await page.goto(
        'https://www.naukri.com/nlogin/login?URL=//www.naukri.com/mnjuser/profile?id=&altresid'
    );

    await page
        .getByRole('textbox', {
            name: 'Enter Email ID / Username'
        })
        .fill(process.env.NAUKRI_EMAIL);

    await page
        .getByRole('textbox', {
            name: 'Enter Password'
        })
        .fill(process.env.NAUKRI_PASSWORD);

    await page.getByText('Show', {
        exact: true
    }).click();

    await page.getByRole('button', {
        name: 'Login',
        exact: true
    }).click();

    await page.waitForTimeout(3000);

    // 4. Go directly to profile if we are not already there
    if (!page.url().includes('/mnjuser/profile')) {
        await page.goto('https://www.naukri.com/mnjuser/profile');
        await page.waitForLoadState('domcontentloaded');
    }
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Edit basic details' }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByText('Availability to join', { exact: true })).toBeVisible();
    await page.locator('span').filter({ hasText: '1 Month' }).click();
    await page.getByText('15 Days or less', { exact: true }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.locator('.lightbox.profileEditDrawer.profileUpdatedProLayer > .crossLayer > .icon').click();
    await page.waitForTimeout(3000);

    // ============================================================
    // 4. UPDATE RESUME
    // ============================================================

    console.log('\n[4] Updating resume...');

    const updateResumeButton = page.getByRole('button', {
        name: 'Update resume'
    });
    await expect(updateResumeButton).toBeVisible({
        timeout: 15000
    });

    // ============================================================
    // RESUME FILE PATH
    // ============================================================

    const resumePath = path.resolve(
        'resume',
        'Tamilarasan_QA_Engineer.pdf'
    );
    console.log('Resume path:', resumePath);

    // ============================================================
    // HANDLE WINDOWS FILE PICKER
    // ============================================================

    const fileChooserPromise =
        page.waitForEvent('filechooser');
    await updateResumeButton.click();

    console.log('Update resume clicked.');

    // Wait for Windows file picker to be triggered
    const fileChooser = await fileChooserPromise;

    // ============================================================
    // SELECT RESUME FILE
    // ============================================================

    await fileChooser.setFiles(resumePath);
    console.log('Resume selected successfully.');
    await page.waitForTimeout(5000);

    await expect(page.locator('#lazyKeySkills').getByText('Key skills')).toBeVisible();
    await page.locator('#lazyKeySkills').getByText('editOneTheme').click();
    await page.waitForTimeout(2000);
    await page.locator('div:nth-child(17) > .material-icons').click();
    await page.waitForTimeout(2000);
    // await page.getByRole('textbox', { name: 'Add skills' }).click();
    await page.getByRole('combobox', { name: 'Add skills' }).click();
    await page.waitForTimeout(2000);

    const addSkills = page.getByRole('combobox', { name: 'Add skills' });
    await addSkills.click();
    await addSkills.pressSequentially('Jira', { delay: 150 });
    await page.waitForTimeout(4500);

    const jiraSuggestion = page
        .locator('#sugDrp_keySkillSugg')
        .locator('li')
        .filter({ hasText: /jira/i })
        .first();

    if (await jiraSuggestion.isVisible().catch(() => false)) {
        await jiraSuggestion.click();
        console.log('JIRA selected from dropdown');
    } else {
        console.log('JIRA dropdown suggestion not available');
        await addSkills.press('ArrowDown');
        await addSkills.press('Enter');
    }
    await page.getByRole('button', { name: 'Save' }).click();
});

// ============================================================
// ENV VALIDATION For LinkedIn
// ============================================================

if (!process.env.LINKEDIN_EMAIL || !process.env.LINKEDIN_PASSWORD) {
    throw new Error(
        'LINKEDIN_EMAIL or LINKEDIN_PASSWORD is missing in .env'
    );
}

test('LinkedIn Profile Update', async ({ page }) => {

    // Increase TOTAL test timeout
    test.setTimeout(180000); // 3 minutes

    await page.goto('https://www.linkedin.com/login/');
    await page.getByRole('textbox', { name: 'Email or phone' })
        .fill(process.env.LINKEDIN_EMAIL);
    await page.getByRole('textbox', { name: 'Password' })
        .fill(process.env.LINKEDIN_PASSWORD);
    await page.getByRole('button', {
        name: 'Sign in',
        exact: true
    }).click();

    // =====================================================
    // 5. WAIT FOR MOBILE APPROVAL
    // =====================================================

    console.log('Waiting for LinkedIn mobile approval...');
    const profileLink = page
        .locator('a[href*="/in/"]')
        .filter({ hasText: /Tamilarasan R/i })
        .first();

    // Playwright waits until profile link appears
    // You have up to 2 minutes to approve on mobile
    await expect(profileLink).toBeVisible({
        timeout: 150000
    });

    console.log('Mobile approval completed.');
    console.log('LinkedIn profile page is available.');
    // =====================================================
    // 6. GO TO PROFILE
    // =====================================================
    await profileLink.click();
    await page.waitForLoadState('domcontentloaded');
    console.log('Profile opened.');
    // =====================================================
    // 7. EDIT PROFILE
    // =====================================================
    const editProfile = page
        .getByTestId('lazy-column')
        .getByRole('link', { name: 'Edit profile' });

    await expect(editProfile).toBeVisible({
        timeout: 15000
    });

    await editProfile.click();
    // =====================================================
    // 8. WAIT FOR PROFILE EDIT PAGE
    // =====================================================

    await page.waitForTimeout(2000);

    console.log('Edit profile opened.');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('link', { name: 'Edit about' }).click();
    // Wait for editor to appear
    const editor = page.getByTestId(
        'ui-core-tiptap-text-editor-wrapper'
    );

    await editor.waitFor({
        state: 'visible',
        timeout: 15000
    });

    // Find ONLY "Available to join immediately"
    const lineToRemove = editor.getByText(
        'Available to join immediately',
        { exact: true }
    );

    // Check whether the text exists
    const count = await lineToRemove.count();

    if (count > 0) {
        // Text exists → remove it
        await lineToRemove.click();
        await page.keyboard.press('Home');
        await page.keyboard.press('Shift+End');
        await page.keyboard.press('Backspace');

        console.log('Removed: Available to join immediately.');
    } else {
        // Text doesn't exist → leave content unchanged
        console.log('Text not found. Leaving content unchanged.');
    }

    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(5000);
    await page.getByRole('link', { name: 'Edit about' }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('textbox', { name: 'About' }).fill(
        `QA Engineer with 4.5+ years of experience testing a multi-tenant, product-based CMMS SaaS platform across web and mobile. Strong in Manual, API and Database Testing. Immediate joiner based in Bengaluru, open to on-site, hybrid or remote roles.

What I do:

- Functional, regression, integration, smoke, sanity, end-to-end and UAT testing
- REST API testing with Postman (CRUD, OAuth 2.0/Bearer Token, schema validation, negative testing)
- Database validation with SQL (PostgreSQL) and MongoDB
- Test case design, RTM, defect lifecycle and root cause analysis
- Release validation, production smoke testing, cross-browser and Android/iOS testing
- Agile Scrum: sprint planning, stand-ups, retrospectives; defect tracking in Jira

Results at Daacoworks:
- 1,200+ manual test cases with 95%+ requirement coverage
- 60+ REST API endpoints validated
- 100+ backend data scenarios cross-checked
- 150+ defects logged and tracked with root cause analysis
- 12+ production releases supported, zero P0 production defects over six consecutive months

Automation (hands-on, personal projects): Playwright with JavaScript, including a Page Object Model framework, 25+ regression scenarios across Chromium, Firefox and WebKit, and a GitHub Actions workflow. I also use AI tools (Claude, ChatGPT, GitHub Copilot) for test design and edge cases, with all outputs manually reviewed.
Looking for: QA Engineer / Software Test Engineer / Quality Analyst roles in Bengaluru & Remote.
GitHub: github.com/tamilarasan-qa
Email: ta06448@gmail.com`
    );
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Me', exact: true }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('link', { name: 'Sign out' }).click();
});