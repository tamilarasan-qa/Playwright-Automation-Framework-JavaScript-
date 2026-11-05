require('dotenv').config();

const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Folder where the Playwright script saves QA_Outreach.xlsx
const OUTPUT_DIR =
  'D:\\script\\script\\Playwright_Automation\\tests\\output';

const EXCEL_FILE = path.join(
  OUTPUT_DIR,
  'QA_Outreach.xlsx'
);

const RESUME_FILE = path.join(
  PROJECT_ROOT,
  'resume',
  'Tamilarasan_QA_Engineer.pdf'
);

// Keep false for preview mode.
// Change to true only when ready to send emails.
const SEND_EMAILS =
    process.env.SEND_EMAILS === 'true';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

function normalizeHeader(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, '');
}

async function main() {
    // 1. Validate files and credentials
    if (!fs.existsSync(EXCEL_FILE)) {
        throw new Error(
            `Excel file not found: ${EXCEL_FILE}`
        );
    }

    if (!fs.existsSync(RESUME_FILE)) {
        throw new Error(
            `Resume not found: ${RESUME_FILE}`
        );
    }

    if (!process.env.SMTP_USER ||
        !process.env.SMTP_PASS) {
        throw new Error(
            'Configure SMTP_USER and SMTP_PASS in .env'
        );
    }

    // 2. Read Excel workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE);

    const sheet = workbook.worksheets[0];

    if (!sheet) {
        throw new Error('No worksheet found.');
    }

    // 3. Read column headers
    const headerRow = sheet.getRow(1);

    const headers = headerRow.values
        .slice(1)
        .map(normalizeHeader);

    const emailCol =
        headers.indexOf('publicemail') + 1;

    const subjectCol =
        headers.indexOf('subject') + 1;

    const bodyCol =
        headers.indexOf('emailbody') + 1;

    if (!emailCol || !subjectCol || !bodyCol) {
        throw new Error(
            'Required columns: Public Email, Subject, Email Body'
        );
    }

    // 4. Add Status column if missing
    let statusCol =
        headers.indexOf('status') + 1;

    if (!statusCol) {
        statusCol = headerRow.cellCount + 1;
        headerRow.getCell(statusCol).value = 'Status';
    }

    // 5. Verify SMTP only when sending is enabled
    if (SEND_EMAILS) {
        await transporter.verify();
        console.log('SMTP connection verified.');
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let previewed = 0;

    // 6. Process each Excel row
    for (
        let rowNum = 2;
        rowNum <= sheet.rowCount;
        rowNum++
    ) {
        const row = sheet.getRow(rowNum);

        const toEmail = String(
            row.getCell(emailCol).text || ''
        ).trim();

        const subject = String(
            row.getCell(subjectCol).text || ''
        ).trim();

        const body = String(
            row.getCell(bodyCol).text || ''
        ).trim();

        const statusCell =
            row.getCell(statusCol);

        const currentStatus = String(
            statusCell.text || ''
        ).trim().toUpperCase();

        // Skip emails already sent
        if (currentStatus === 'SENT') {
            console.log(
                `Row ${rowNum}: already SENT; skipped.`
            );
            skipped++;
            continue;
        }

        // Skip incomplete rows
        if (!toEmail || !subject || !body) {
            console.log(
                `Row ${rowNum}: missing data; skipped.`
            );

            statusCell.value = 'SKIPPED - Missing data';
            skipped++;
            continue;
        }

        // Validate recipient email address
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(toEmail)) {
            console.log(
                `Row ${rowNum}: invalid email; skipped.`
            );

            statusCell.value = 'SKIPPED - Invalid email';
            skipped++;
            continue;
        }

        console.log(`\nRow ${rowNum}`);
        console.log('To:', toEmail);
        console.log('Subject:', subject);
        console.log(
            'Attachment:',
            path.basename(RESUME_FILE)
        );

        // Preview mode: never send
        if (!SEND_EMAILS) {
            console.log('PREVIEW ONLY - not sent.');
            previewed++;
            continue;
        }

        // 7. Send email
        try {
            const info = await transporter.sendMail({
                from: {
                    name: 'Tamilarasan R',
                    address: process.env.SMTP_USER
                },

                to: toEmail,
                subject: subject,
                text: body,

                attachments: [
                    {
                        filename:
                            'Tamilarasan_QA_Engineer.pdf',
                        path: RESUME_FILE,
                        contentType: 'application/pdf'
                    }
                ]
            });

            statusCell.value = 'SENT';

            // Save immediately after successful send
            await workbook.xlsx.writeFile(EXCEL_FILE);

            sent++;

            console.log(
                'Sent successfully:',
                info.messageId
            );

            // Delay between emails
            await sleep(2000);

        } catch (error) {
            statusCell.value = 'FAILED';
            failed++;

            console.error(
                `Row ${rowNum} failed:`,
                error.message
            );

            // Save failure status
            await workbook.xlsx.writeFile(EXCEL_FILE);
        }
    }

    // 8. Save final status updates
    await workbook.xlsx.writeFile(EXCEL_FILE);

    console.log('\n===== OUTREACH SUMMARY =====');
    console.log('Sent:', sent);
    console.log('Failed:', failed);
    console.log('Skipped:', skipped);
    console.log('Previewed:', previewed);
    console.log(
        'Mode:',
        SEND_EMAILS ? 'SEND' : 'PREVIEW'
    );
}

main().catch(error => {
    console.error(
        'Automation failed:',
        error.message
    );

    process.exitCode = 1;
});