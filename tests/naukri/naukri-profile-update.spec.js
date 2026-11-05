import { test, expect } from '@playwright/test';
import 'dotenv/config';
import path from 'path';

// ============================================================
// ENV VALIDATION FOR NAUKRI
// ============================================================

if (!process.env.NAUKRI_EMAIL || !process.env.NAUKRI_PASSWORD) {
    throw new Error(
        'NAUKRI_EMAIL or NAUKRI_PASSWORD is missing from environment variables'
    );
}


// ============================================================
// NAUKRI PROFILE UPDATE
// ============================================================

test('Naukri Profile Update', async ({ page }) => {

    // Naukri can be slow during login/profile/resume upload
    test.setTimeout(180000); // 3 minutes


    // ============================================================
    // 1. LOGIN
    // ============================================================

    console.log('\n========================================');
    console.log('[1] Logging into Naukri...');
    console.log('========================================');

    await page.goto(
        'https://www.naukri.com/nlogin/login?URL=//www.naukri.com/mnjuser/profile?id=&altresid',
        {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        }
    );

    const emailInput = page.getByRole('textbox', {
        name: 'Enter Email ID / Username'
    });

    await expect(emailInput).toBeVisible({
        timeout: 30000
    });

    await emailInput.fill(process.env.NAUKRI_EMAIL);

    const passwordInput = page.getByRole('textbox', {
        name: 'Enter Password'
    });

    await expect(passwordInput).toBeVisible({
        timeout: 15000
    });

    await passwordInput.fill(process.env.NAUKRI_PASSWORD);

    // Show password
    const showButton = page.getByText('Show', {
        exact: true
    });

    if (await showButton.isVisible().catch(() => false)) {
        await showButton.click();
    }

    // Login
    await page.getByRole('button', {
        name: 'Login',
        exact: true
    }).click();

    console.log('Login button clicked.');


    // ============================================================
    // 2. WAIT FOR LOGIN / PROFILE
    // ============================================================

    console.log('[2] Waiting for Naukri profile...');

    await page.waitForTimeout(3000);

    if (!page.url().includes('/mnjuser/profile')) {

        console.log('Navigating directly to Naukri profile...');

        await page.goto(
            'https://www.naukri.com/mnjuser/profile',
            {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            }
        );
    }

    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());


    // ============================================================
    // 3. UPDATE AVAILABILITY
    // ============================================================

    console.log('\n========================================');
    console.log('[3] Updating availability...');
    console.log('========================================');

    const editBasicDetails = page.getByRole('button', {
        name: 'Edit basic details'
    });

    await expect(editBasicDetails).toBeVisible({
        timeout: 20000
    });

    await editBasicDetails.click();

    console.log('Edit basic details opened.');

    await expect(
        page.getByText('Availability to join', {
            exact: true
        })
    ).toBeVisible({
        timeout: 15000
    });

    // Open availability dropdown
    const oneMonthOption = page
        .locator('span')
        .filter({ hasText: '1 Month' })
        .first();

    await expect(oneMonthOption).toBeVisible({
        timeout: 10000
    });

    await oneMonthOption.click();

    // Select 15 Days or less
    const fifteenDaysOption = page.getByText(
        '15 Days or less',
        {
            exact: true
        }
    );

    await expect(fifteenDaysOption).toBeVisible({
        timeout: 10000
    });

    await fifteenDaysOption.click();

    console.log('Availability selected: 15 Days or less.');

    // Save
    const availabilitySaveButton = page.getByRole('button', {
        name: 'Save'
    }).last();

    await expect(availabilitySaveButton).toBeVisible({
        timeout: 10000
    });

    await availabilitySaveButton.click();

    console.log('Availability saved.');

    await page.waitForTimeout(3000);


    // ============================================================
    // CLOSE PROFILE EDIT DRAWER
    // ============================================================

    const closeProfileDrawer = page.locator(
        '.lightbox.profileEditDrawer.profileUpdatedProLayer > .crossLayer > .icon'
    );

    if (await closeProfileDrawer.isVisible().catch(() => false)) {

        await closeProfileDrawer.click();

        console.log('Profile edit drawer closed.');

    }


    await page.waitForTimeout(2000);


    // ============================================================
    // 4. UPDATE RESUME
    // ============================================================

    console.log('\n========================================');
    console.log('[4] Updating resume...');
    console.log('========================================');

    const updateResumeButton = page.getByRole('button', {
        name: 'Update resume'
    });

    await expect(updateResumeButton).toBeVisible({
        timeout: 20000
    });

    // ------------------------------------------------------------
    // RESUME PATH
    // ------------------------------------------------------------

    const resumePath = path.resolve(
        'resume',
        'Tamilarasan_QA_Engineer.pdf'
    );

    console.log('Resume path:', resumePath);


    // ------------------------------------------------------------
    // HANDLE FILE CHOOSER
    // ------------------------------------------------------------

    const fileChooserPromise =
        page.waitForEvent('filechooser');

    await updateResumeButton.click();

    console.log('Update resume clicked.');

    const fileChooser = await fileChooserPromise;

    // Select resume
    await fileChooser.setFiles(resumePath);

    console.log('Resume selected successfully.');

    // Wait for upload processing
    await page.waitForTimeout(5000);

    console.log('Resume upload completed.');



    // ============================================================
    // 5. UPDATE KEY SKILLS
    // ============================================================

    console.log('\n========================================');
    console.log('[5] Updating Key Skills...');
    console.log('========================================');

    await expect(
        page.locator('#lazyKeySkills').getByText('Key skills')
    ).toBeVisible({
        timeout: 20000
    });

    console.log('Key Skills section visible.');


    // ------------------------------------------------------------
    // OPEN KEY SKILLS EDIT
    // ------------------------------------------------------------

    await page
        .locator('#lazyKeySkills')
        .getByText('editOneTheme')
        .click();

    console.log('Key Skills edit opened.');

    await page.waitForTimeout(2000);


    // ------------------------------------------------------------
    // CLICK ADD SKILLS
    // ------------------------------------------------------------

    await page
        .locator('div:nth-child(17) > .material-icons')
        .click();

    await page.waitForTimeout(1000);


    // ------------------------------------------------------------
    // ADD SKILLS COMBOBOX
    // ------------------------------------------------------------

    const addSkills = page.getByRole('combobox', {
        name: 'Add skills'
    });

    await expect(addSkills).toBeVisible({
        timeout: 15000
    });

    await addSkills.click();

    // Enter Jira
    await addSkills.fill('Jira');

    console.log('Jira entered. Waiting for suggestion...');


    // ============================================================
    // WAIT FOR JIRA SUGGESTION
    // ============================================================

    const jiraSuggestion = page
        .locator('#sugDrp_keySkillSugg')
        .locator('li')
        .filter({
            hasText: /^Jira$/i
        })
        .first();

    try {

        await expect(jiraSuggestion).toBeVisible({
            timeout: 15000
        });

        await jiraSuggestion.click();

        console.log('JIRA selected from dropdown.');

    } catch (error) {

        console.log(
            'JIRA suggestion not displayed. Trying keyboard selection...'
        );

        await addSkills.press('ArrowDown');
        await addSkills.press('Enter');

        console.log('JIRA selected using keyboard.');

    }


    // ============================================================
    // SAVE KEY SKILLS
    // ============================================================

    const skillsSaveButton = page.getByRole('button', {
        name: 'Save'
    }).last();

    await expect(skillsSaveButton).toBeVisible({
        timeout: 15000
    });

    await skillsSaveButton.click();

    console.log('Key Skills saved successfully.');


    // ============================================================
    // FINAL WAIT
    // ============================================================

    await page.waitForTimeout(3000);

    console.log('\n========================================');
    console.log('NAUKRI PROFILE UPDATE COMPLETED');
    console.log('========================================');
});