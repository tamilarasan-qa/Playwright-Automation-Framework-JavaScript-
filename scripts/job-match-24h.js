/**
 * scripts/job-match-24h.js
 *
 * Finds jobs posted in the last 24 hours from:
 *   1. LinkedIn (public search, no login)
 *   2. Naukri   (real Chrome, reads Naukri's search API response)
 *   3. Adzuna   (official free API - optional, needs keys in .env)
 * Scores them against your resume PDF and saves matches to Excel.
 *
 * Install once:
 *   npm i exceljs pdf-parse@1.1.1 dotenv
 *
 * Run:
 *   node scripts/job-match-24h.js
 *
 * Optional .env values:
 *   MIN_SCORE=85               (only store jobs with Match % >= this)
 *   MAX_JOBS_PER_SOURCE=80
 *   HEADLESS=false             (LinkedIn browser; Naukri always visible)
 *   ADZUNA_APP_ID=xxxx         (free at https://developer.adzuna.com)
 *   ADZUNA_APP_KEY=xxxx
 *
 * Add this line to .gitignore:   .naukri-profile
 */

const { chromium } = require('playwright');
const ExcelJS = require('exceljs');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

try { require('dotenv').config(); } catch (_) { /* dotenv optional */ }

// ============================================================
// CONFIG
// ============================================================
const PROJECT_ROOT = path.resolve(__dirname, '..');

const RESUME_FILE = path.join(
  PROJECT_ROOT,
  'resume',
  'Tamilarasan_QA_Engineer.pdf'
);

// D:\script\script\Playwright_Automation\tests\output
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'tests', 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Job_Matches_Last24h.xlsx');
const NAUKRI_PROFILE_DIR = path.join(PROJECT_ROOT, '.naukri-profile');

const KEYWORDS = [
  'QA Engineer',
  'Senior QA Engineer',
  'Automation Test Engineer',
  'Test Automation Engineer',
  'Playwright',
  'SDET',
  'Software Test Engineer',
  'Quality Engineer',
  'API Testing',
  'Manual Testing',
  'Manual QA Engineer',
];

// remote:true -> LinkedIn only, searches India with the "Remote" filter
const LOCATIONS = [
  { name: 'Bengaluru' },
  { name: 'India', remote: true },
];

const MIN_SCORE = Number(process.env.MIN_SCORE || 85);
const MAX_JOBS_PER_SOURCE = Number(process.env.MAX_JOBS_PER_SOURCE || 80);
const HEADLESS = process.env.HEADLESS === 'false' ? false : true;

// Words that must appear in the job title, otherwise the job is skipped
const TITLE_MUST_MATCH = /\b(qa|quality|test|testing|tester|sdet|automation)\b/i;

// Skills dictionary: anything found in BOTH resume and job description counts
const SKILL_DICTIONARY = [
  'playwright', 'javascript', 'node.js', 'nodejs', 'automation',
  'manual testing', 'functional testing', 'regression', 'smoke', 'sanity',
  'integration testing', 'end-to-end', 'e2e', 'uat',
  'api testing', 'postman', 'rest api', 'rest', 'oauth', 'json',
  'sql', 'postgresql', 'mongodb', 'database testing',
  'page object model', 'pom', 'cross-browser', 'github actions', 'ci/cd',
  'git', 'jira', 'agile', 'scrum', 'test cases', 'test plan', 'rtm',
  'defect', 'bug', 'saas', 'mobile testing', 'android', 'ios',
  'selenium', 'cypress', 'rest assured', 'jenkins',
  // manual testing skills
  'exploratory', 'ad-hoc', 'test scenarios', 'test design', 'test execution',
  'test management', 'bug reporting', 'defect tracking', 'defect life cycle',
  'defect lifecycle', 'black box', 'usability', 'compatibility',
  'requirement analysis', 'traceability', 'release validation', 'root cause',
  'stlc', 'sdlc', 'user acceptance', 'risk-based', 'test strategy',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const polite = () => sleep(rand(1500, 3500));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
// whole-word match, so "rest" does not match "interest" and "ios" does not match "scenarios"
const hasSkill = (text, skill) =>
  new RegExp(`(^|[^a-z0-9])${escRe(skill)}s?($|[^a-z0-9])`, 'i').test(text);
// ---------- recruiter email extraction (only emails written in the posting) ----------
const BAD_EMAIL = /(noreply|no-reply|donotreply|do-not-reply|support@|privacy@|grievance|abuse@|@linkedin\.|@naukri\.|@example\.|\.(png|jpe?g|gif|svg|webp)$)/i;
function extractEmails(text, extra = []) {
  const norm = String(text || '')
    .replace(/\s*[\[\(\{]\s*at\s*[\]\)\}]\s*/gi, '@')   // name [at] company
    .replace(/\s*[\[\(\{]\s*dot\s*[\]\)\}]\s*/gi, '.'); // company [dot] com
  const found = norm.match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi) || [];
  const all = [...found, ...(extra || [])]
    .map((e) => String(e).trim().toLowerCase().replace(/[.,;:)]+$/, ''))
    .filter((e) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e) && !BAD_EMAIL.test(e));
  return [...new Set(all)].join('; ');
}

// ---------- email subject + body (edit CANDIDATE / template to match your style) ----------
const CANDIDATE = {
  name: 'Tamilarasan R',
  phone: '+91 8122286890',
  email: 'ta06448@gmail.com',
  linkedin: 'linkedin.com/in/tamilarasan-r-qa',
  github: 'github.com/tamilarasan-qa',
};

function cleanJobTitle(t) {
  const cleaned = String(t || '')
    .replace(/[\(\[].*?[\)\]]/g, ' ')
    .split(/\s[-–|]\s|,/)[0]
    .replace(/\s+(L\d|I{1,3}|IV|\d)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || String(t || '').trim();
}

function buildEmail(r) {
  const title = cleanJobTitle(r.title);
  const subject = `Application for ${title} - 4.5 Years QA Experience | Immediate Joiner`;
  const skills = String(r.matched || '')
    .split(',').map((x) => x.trim()).filter(Boolean).slice(0, 5).join(', ');

  const body = [
    `Dear Hiring Team${r.company ? ' at ' + r.company : ''},`,
    '',
    `I am writing to apply for the ${title} position. I am a QA Engineer with 4.5 years of experience testing a multi-tenant, product-based CMMS SaaS platform across web and mobile.`,
    '',
    skills ? `My profile matches this role in: ${skills}.` : '',
    '',
    'Highlights:',
    '- Functional, regression, integration and end-to-end testing across 12+ production releases',
    '- 60+ REST API endpoints validated with Postman; backend validation using PostgreSQL and MongoDB',
    '- 1+ year of Playwright (JavaScript) automation: Page Object Model, cross-browser runs, GitHub Actions',
    '',
    'I am an immediate joiner based in Bangalore. My resume is attached for your review, and I would be happy to discuss how I can contribute to your team.',
    '',
    'Thanks & Regards,',
    CANDIDATE.name,
    `${CANDIDATE.phone} | ${CANDIDATE.email}`,
    `LinkedIn: ${CANDIDATE.linkedin} | GitHub: ${CANDIDATE.github}`,
  ].filter((line, i, a) => !(line === '' && a[i - 1] === '')).join('\n');

  return { subject, body };
}

const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// page.evaluate that survives page redirects ("Execution context was destroyed")
async function safeEvaluate(page, fn, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
      return await page.evaluate(fn);
    } catch (e) {
      const retryable = /context was destroyed|navigation|Target closed/i.test(e.message);
      if (!retryable || i === tries - 1) throw e;
      await sleep(1500);
    }
  }
}

// ============================================================
// RESUME PROFILE
// ============================================================
async function buildProfile() {
  if (!fs.existsSync(RESUME_FILE)) {
    throw new Error(`Resume not found: ${RESUME_FILE}`);
  }
  const data = await pdfParse(fs.readFileSync(RESUME_FILE));
  const text = data.text.toLowerCase();

  const skills = SKILL_DICTIONARY.filter((s) => hasSkill(text, s));

  const expMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*years/);
  const years = expMatch ? parseFloat(expMatch[1]) : 4.5;

  console.log(`Resume skills detected (${skills.length}): ${skills.join(', ')}`);
  console.log(`Experience: ${years} years\n`);
  return { skills, years };
}

// ============================================================
// SCORING
// ============================================================
function experienceScore(text, myYears) {
  const range = text.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*\+?\s*(?:years|yrs)/i);
  const plus = text.match(/(\d+)\s*\+\s*(?:years|yrs)/i);

  let min, max;
  if (range) { min = +range[1]; max = +range[2]; }
  else if (plus) { min = +plus[1]; max = min + 4; }
  else return 70; // not mentioned -> neutral

  if (myYears >= min - 0.5 && myYears <= max + 0.5) return 100;
  if (myYears >= min - 1.5 && myYears <= max + 1.5) return 50;
  return 0;
}

function scoreJob(job, profile) {
  const jd = `${job.title} ${job.description}`.toLowerCase();

  const matched = profile.skills.filter((s) => hasSkill(jd, s));
  const skillScore = Math.min(
    100,
    (matched.length / Math.min(10, Math.max(profile.skills.length, 1))) * 100
  );

  let titleScore = /qa|test|sdet|quality/i.test(job.title) ? 80 : 40;
  if (/playwright|automation|sdet/i.test(job.title)) titleScore = 100;

  const expScore = experienceScore(jd, profile.years);

  const total = Math.round(skillScore * 0.6 + titleScore * 0.25 + expScore * 0.15);
  return { score: total, matched };
}

// ============================================================
// SOURCE 1: LINKEDIN (public search, last 24 hours)
// ============================================================
async function scrapeLinkedIn(context, profile) {
  console.log('===== LinkedIn =====');
  const page = await context.newPage();
  const found = new Map();

  for (const keyword of KEYWORDS) {
    for (const loc of LOCATIONS) {
      const url =
        'https://www.linkedin.com/jobs/search/?' +
        `keywords=${encodeURIComponent(keyword)}` +
        `&location=${encodeURIComponent(loc.name)}` +
        '&f_TPR=r86400&sortBy=DD' +
        (loc.remote ? '&f_WT=2' : '');

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        if (page.url().includes('authwall')) {
          console.log('LinkedIn asked for login, skipping search:', keyword);
          continue;
        }
        for (let i = 0; i < 3; i++) {
          await page.mouse.wheel(0, 4000);
          await sleep(1200);
        }

        const cards = await page.$$eval('.base-card', (els) =>
          els.map((c) => ({
            title: c.querySelector('.base-search-card__title')?.innerText.trim(),
            company: c.querySelector('.base-search-card__subtitle')?.innerText.trim(),
            location: c.querySelector('.job-search-card__location')?.innerText.trim(),
            posted: c.querySelector('time')?.getAttribute('datetime'),
            link: c.querySelector('a.base-card__full-link')?.href,
          }))
        );

        for (const c of cards) {
          if (!c.title || !c.link) continue;
          const clean = c.link.split('?')[0];
          if (!found.has(clean)) found.set(clean, { ...c, link: clean });
        }
        console.log(`"${keyword}" in ${loc.name}${loc.remote ? ' (remote)' : ''}: ${cards.length} cards`);
      } catch (e) {
        console.log(`LinkedIn search failed for "${keyword}": ${e.message}`);
      }
      await polite();
    }
  }

  const results = [];
  const list = [...found.values()]
    .filter((j) => TITLE_MUST_MATCH.test(j.title))
    .slice(0, MAX_JOBS_PER_SOURCE);
  console.log(`LinkedIn unique relevant jobs: ${list.length}`);

  for (const job of list) {
    try {
      await page.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (page.url().includes('authwall')) continue;

      const detail = await safeEvaluate(page, () => {
        const desc =
          document.querySelector('.show-more-less-html__markup')?.innerText || '';
        const criteria = [...document.querySelectorAll('.description__job-criteria-text')]
          .map((e) => e.innerText.trim())
          .join(' | ');
        const applyRaw = document.querySelector('code#applyUrl')?.textContent || '';
        const mailtos = [...document.querySelectorAll('a[href^="mailto:"]')]
          .map((a) => a.getAttribute('href').replace(/^mailto:/i, '').split('?')[0]);
        return { desc, criteria, applyRaw, mailtos };
      });

      // Company-site apply URL is stored inside an HTML comment: <!--"https://..."-->
      let applyLink = job.link; // fallback = LinkedIn job page (Easy Apply)
      const am = detail.applyRaw.match(/"(https?:[^"]+)"/);
      if (am) {
        try {
          const u = new URL(am[1].replace(/&amp;/g, '&'));
          applyLink = u.searchParams.get('url') || am[1];
        } catch (_) { applyLink = am[1]; }
      }

      const { score, matched } = scoreJob(
        { ...job, description: `${detail.desc} ${detail.criteria}` },
        profile
      );

      results.push({
        source: 'LinkedIn',
        applyLink,
        recruiterEmail: extractEmails(detail.desc, detail.mailtos),
        title: job.title,
        company: job.company,
        location: job.location,
        experience: '',
        posted: job.posted || '',
        score,
        matched: matched.join(', '),
        jobLink: job.link,
      });
      console.log(`  [${score}%] ${job.title} - ${job.company}`);
    } catch (e) {
      console.log(`  skipped ${job.link}: ${e.message}`);
    }
    await polite();
  }

  await page.close();
  return results;
}

// ============================================================
// SOURCE 2: NAUKRI (real Chrome + reads Naukri's search API)
// ============================================================
async function scrapeNaukri(profile) {
  console.log('\n===== Naukri =====');

  const launchOpts = {
    headless: false, // Naukri blocks headless browsers
    viewport: { width: 1366, height: 850 },
    locale: 'en-IN',
    args: ['--disable-blink-features=AutomationControlled'],
  };

  let context;
  try {
    context = await chromium.launchPersistentContext(NAUKRI_PROFILE_DIR, {
      ...launchOpts,
      channel: 'chrome', // uses your installed Google Chrome
    });
  } catch (e) {
    console.log('Google Chrome not found, using bundled Chromium instead.');
    context = await chromium.launchPersistentContext(NAUKRI_PROFILE_DIR, launchOpts);
  }

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = context.pages()[0] || (await context.newPage());
  const found = new Map();

  // Warm-up visit so Naukri sets its normal cookies before searching
  await page.goto('https://www.naukri.com', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(3000);

  // Capture Naukri's own search API responses
  let bucket = [];
  page.on('response', async (res) => {
    try {
      if (res.url().includes('/jobapi/v3/search') && res.status() === 200) {
        const json = await res.json();
        if (Array.isArray(json.jobDetails)) bucket.push(...json.jobDetails);
      }
    } catch (_) { /* ignore non-JSON */ }
  });

  const ph = (d, type) =>
    (d.placeholders || []).find((p) => p.type === type)?.label || '';

  const localLocations = LOCATIONS.filter((l) => !l.remote);

  for (const keyword of KEYWORDS) {
    for (const loc of localLocations) {
      bucket = [];
      const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const url =
        `https://www.naukri.com/${slug}-jobs-in-${loc.name.toLowerCase()}` +
        `?k=${encodeURIComponent(keyword)}&l=${encodeURIComponent(loc.name)}` +
        '&experience=4&jobAge=1'; // experience 4 yrs + freshness = last 1 day

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page
          .waitForSelector('.srp-jobtuple-wrapper, .jobTuple, [class*="jobTuple"]', { timeout: 20000 })
          .catch(() => {});
        await sleep(2500);

        // Sort by Date (best effort - clicks Naukri's sort dropdown)
        const before = [...bucket];
        bucket = [];
        try {
          await page.locator('#filter-sort, button:has-text("Sort by"), [class*="sort"] button').first().click({ timeout: 4000 });
          await page.locator('[data-id="filter-sort-f"], li:has-text("Date"), a:has-text("Date")').first().click({ timeout: 4000 });
          await sleep(3000);
        } catch (_) { /* sort control not found - keep default order */ }
        if (bucket.length === 0) bucket = before;

        let jobs = bucket.map((d) => ({
          title: d.title,
          company: d.companyName,
          link: d.jdURL
            ? (d.jdURL.startsWith('http') ? d.jdURL : 'https://www.naukri.com' + d.jdURL)
            : '',
          experience: ph(d, 'experience'),
          location: ph(d, 'location'),
          posted: d.footerPlaceholderLabel || '',
          snippet: stripHtml(d.jobDescription),
        }));

        // Fallback: read the visible cards
        if (jobs.length === 0) {
          jobs = await page.$$eval(
            '.srp-jobtuple-wrapper, .jobTuple, [class*="jobTuple"]',
            (els) =>
              els.map((c) => ({
                title: c.querySelector('a.title')?.innerText.trim(),
                link: c.querySelector('a.title')?.href,
                company: c.querySelector('a.comp-name')?.innerText.trim(),
                experience: c.querySelector('.exp-wrap, .expwdth')?.innerText.trim(),
                location: c.querySelector('.loc-wrap, .locWdth')?.innerText.trim(),
                posted: c.querySelector('.job-post-day')?.innerText.trim(),
                snippet: c.querySelector('.job-desc')?.innerText.trim(),
              }))
          );
        }

        if (jobs.length === 0) {
          // Save evidence so we can see what Naukri actually returned
          fs.mkdirSync(OUTPUT_DIR, { recursive: true });
          const stamp = `${slug}-${Date.now()}`;
          await page.screenshot({ path: path.join(OUTPUT_DIR, `debug-naukri-${stamp}.png`), fullPage: true }).catch(() => {});
          fs.writeFileSync(path.join(OUTPUT_DIR, `debug-naukri-${stamp}.html`), await page.content());
          console.log(`"${keyword}" in ${loc.name}: 0 jobs. Page title: "${await page.title()}"`);
          console.log(`   debug files saved in ${OUTPUT_DIR}`);
        } else {
          console.log(`"${keyword}" in ${loc.name}: ${jobs.length} jobs`);
        }

        // Keep only: posted within 24h AND experience range overlapping 4-6 years
        jobs = jobs.filter((j) => {
          if (/\b([2-9]|\d{2,})\s*\+?\s*days?\b/i.test(j.posted || '')) return false;
          const m = String(j.experience || '').match(/(\d+)\s*(?:-|to|–)\s*(\d+)/i);
          if (!m) return true;
          return !(+m[2] < 4 || +m[1] > 6);
        });

        for (const j of jobs) {
          if (!j.title || !j.link) continue;
          const clean = j.link.split('?')[0];
          if (!found.has(clean)) found.set(clean, { ...j, link: clean });
        }
      } catch (e) {
        console.log(`Naukri search failed for "${keyword}": ${e.message}`);
      }
      await polite();
    }
  }

  const results = [];
  const list = [...found.values()]
    .filter((j) => TITLE_MUST_MATCH.test(j.title))
    .slice(0, MAX_JOBS_PER_SOURCE);
  console.log(`Naukri unique relevant jobs: ${list.length}`);

  for (const job of list) {
    let desc = '';
    let mailtos = [];
    try {
      await page.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await sleep(1500);
      const d = await safeEvaluate(page, () => ({
        text:
          document.querySelector('[class*="dang-inner-html"], .job-desc')?.innerText ||
          document.body.innerText.slice(0, 6000),
        mailtos: [...document.querySelectorAll('a[href^="mailto:"]')]
          .map((a) => a.getAttribute('href').replace(/^mailto:/i, '').split('?')[0]),
      }));
      desc = d.text;
      mailtos = d.mailtos;
    } catch (_) {
      /* fall back to the search snippet */
    }

    const { score, matched } = scoreJob(
      { ...job, description: `${desc} ${job.snippet || ''} ${job.experience || ''}` },
      profile
    );

    results.push({
      source: 'Naukri',
      applyLink: job.link,
      recruiterEmail: extractEmails(`${desc} ${job.snippet || ''}`, mailtos),
      title: job.title,
      company: job.company,
      location: job.location,
      experience: job.experience || '',
      posted: job.posted || '',
      score,
      matched: matched.join(', '),
      jobLink: job.link,
    });
    console.log(`  [${score}%] ${job.title} - ${job.company}`);
    await polite();
  }

  await context.close();
  return results;
}

// ============================================================
// SOURCE 3: ADZUNA (official API, last 1 day) - optional
// ============================================================
async function fetchAdzuna(profile) {
  console.log('\n===== Adzuna =====');
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) {
    console.log('Skipped (add ADZUNA_APP_ID and ADZUNA_APP_KEY to .env to enable).');
    return [];
  }

  const found = new Map();
  for (const keyword of KEYWORDS) {
    for (const loc of LOCATIONS.filter((l) => !l.remote)) {
      const url =
        'https://api.adzuna.com/v1/api/jobs/in/search/1?' +
        `app_id=${id}&app_key=${key}&results_per_page=50` +
        `&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(loc.name)}` +
        '&max_days_old=1&sort_by=date';
      try {
        const res = await fetch(url);
        if (!res.ok) { console.log(`Adzuna HTTP ${res.status} for "${keyword}"`); continue; }
        const json = await res.json();
        const items = json.results || [];
        console.log(`"${keyword}" in ${loc.name}: ${items.length} jobs`);
        for (const r of items) {
          const link = r.redirect_url;
          if (!link || found.has(link)) continue;
          found.set(link, {
            title: stripHtml(r.title),
            company: r.company?.display_name || '',
            location: r.location?.display_name || '',
            posted: r.created || '',
            description: stripHtml(r.description),
            link,
          });
        }
      } catch (e) {
        console.log(`Adzuna failed for "${keyword}": ${e.message}`);
      }
      await sleep(500);
    }
  }

  const results = [];
  for (const j of [...found.values()].filter((x) => TITLE_MUST_MATCH.test(x.title)).slice(0, MAX_JOBS_PER_SOURCE)) {
    const { score, matched } = scoreJob(j, profile);
    results.push({
      source: 'Adzuna',
      applyLink: j.link,
      recruiterEmail: extractEmails(j.description),
      title: j.title,
      company: j.company,
      location: j.location,
      experience: '',
      posted: j.posted,
      score,
      matched: matched.join(', '),
      jobLink: j.link,
    });
    console.log(`  [${score}%] ${j.title} - ${j.company}`);
  }
  return results;
}

// ============================================================
// EXCEL (append + dedupe by Job Link, only Match % >= MIN_SCORE)
// ============================================================
const COLUMNS = [
  { header: 'Date Found', key: 'dateFound', width: 13 },
  { header: 'Source', key: 'source', width: 10 },
  { header: 'Job Title', key: 'title', width: 40 },
  { header: 'Company', key: 'company', width: 26 },
  { header: 'Location', key: 'location', width: 20 },
  { header: 'Match %', key: 'score', width: 9 },
  { header: 'Job Direct Apply Link', key: 'applyLink', width: 22 },
  { header: 'Recruiter Email', key: 'recruiterEmail', width: 32 },
  { header: 'Email Subject', key: 'emailSubject', width: 55 },
  { header: 'Email Body', key: 'emailBody', width: 70 },
  { header: 'Job Page Link', key: 'jobLink', width: 30 }, // hidden, used for de-duplication
];

// Header -> key, so older Excel layouts are still read correctly
const KEY_BY_HEADER = {
  ...Object.fromEntries(COLUMNS.map((c) => [c.header, c.key])),
  'Job Link': 'jobLink',
  'Direct Apply Link': 'applyLink',
};

function cellText(row, n) {
  const v = row.getCell(n).value;
  if (v && typeof v === 'object' && 'hyperlink' in v) return v.hyperlink;
  if (v && typeof v === 'object' && 'text' in v) return v.text;
  return v;
}

async function saveToExcel(results) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const existing = new Set();
  const oldRows = [];

  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const old = new ExcelJS.Workbook();
      await old.xlsx.readFile(OUTPUT_FILE);
      const oldWs = old.getWorksheet('Jobs');
      if (oldWs) {
        const colKey = {};
        oldWs.getRow(1).eachCell((cell, n) => {
          const k = KEY_BY_HEADER[cell.value];
          if (k) colKey[n] = k;
        });
        oldWs.eachRow((row, i) => {
          if (i === 1) return;
          const r = {};
          for (const [n, k] of Object.entries(colKey)) r[k] = cellText(row, Number(n));
          if (!r.applyLink) r.applyLink = r.jobLink;
          if (r.jobLink) existing.add(r.jobLink);
          if (Number(r.score) >= MIN_SCORE) oldRows.push(r); // drop old low-score rows
        });
      }
    } catch (e) {
      console.log('Could not read old Excel, creating a new one:', e.message);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const fresh = results
    .filter((r) => r.score >= MIN_SCORE && !existing.has(r.jobLink))
    .map((r) => ({ ...r, dateFound: today }));

  // newest day first, best score first inside each day
  const all = [...fresh, ...oldRows].sort((a, b) => {
    if (a.dateFound !== b.dateFound) return String(b.dateFound).localeCompare(String(a.dateFound));
    return (Number(b.score) || 0) - (Number(a.score) || 0);
  });

  const out = new ExcelJS.Workbook();
  const ws = out.addWorksheet('Jobs');
  ws.columns = COLUMNS;
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  for (const r of all) {
    if (r.recruiterEmail) {
      if (!r.emailSubject) {
        const e = buildEmail(r);
        r.emailSubject = e.subject;
        r.emailBody = e.body;
      }
    } else {
      r.recruiterEmail = '';
      r.emailSubject = '';
      r.emailBody = '';
    }
    const row = ws.addRow({
      ...r,
      score: Number(r.score),
      applyLink: r.applyLink ? { text: 'Apply Here', hyperlink: r.applyLink } : '',
      jobLink: r.jobLink || '',
    });
    row.getCell('applyLink').font = { color: { argb: 'FF0563C1' }, underline: true };
    row.alignment = { vertical: 'top', wrapText: false }; // click a cell to read the full email body
  }
  ws.getColumn('jobLink').hidden = true;
  ws.autoFilter = { from: 'A1', to: 'K1' };

  await out.xlsx.writeFile(OUTPUT_FILE);
  return { added: fresh.length, total: all.length };
}

// ============================================================
// MAIN
// ============================================================
(async () => {
  const profile = await buildProfile();
  let all = [];

  // --- LinkedIn (normal browser) ---
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 800 },
    locale: 'en-IN',
  });
  try {
    all = all.concat(await scrapeLinkedIn(context, profile));
  } catch (e) {
    console.log('LinkedIn failed:', e.message);
  }
  await browser.close();

  // --- Naukri (visible real Chrome) ---
  try {
    all = all.concat(await scrapeNaukri(profile));
  } catch (e) {
    console.log('Naukri failed:', e.message);
  }

  // --- Adzuna (API) ---
  try {
    all = all.concat(await fetchAdzuna(profile));
  } catch (e) {
    console.log('Adzuna failed:', e.message);
  }

  const { added, total } = await saveToExcel(all);

  console.log('\n===== JOB MATCH SUMMARY =====');
  console.log(`Jobs scanned            : ${all.length}`);
  console.log(`New matches (>=${MIN_SCORE}%)   : ${added}`);
  console.log(`Total rows in Excel     : ${total}`);
  console.log(`Saved to                : ${OUTPUT_FILE}`);
})().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});