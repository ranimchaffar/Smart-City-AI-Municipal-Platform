import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/ranni/.gemini/antigravity-ide/brain/c34f0687-9b4c-46ee-ab5a-4b0f53367c3b/screenshots';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

  console.log('Navigating to http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Citizen Portal Desktop Screenshot
  console.log('Capturing Citizen Portal Desktop...');
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_citizen_portal_desktop.png'),
    fullPage: false
  });

  // Switch category to Pothole Repair to test interaction
  console.log('Testing category interaction in Citizen Portal...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.service-selection-card'));
    const pothole = cards.find(c => c.textContent?.includes('Pothole Repair'));
    if (pothole) pothole.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02_citizen_portal_pothole_selected.png'),
    fullPage: false
  });

  // 2. Switch to Operations Center (Reference Image 1)
  console.log('Switching to Operations Center (Municipal Dashboard)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.textContent?.includes('Operations Center') || b.textContent?.includes('Dashboard Municipal'));
    if (target) target.click();
  });

  await new Promise(r => setTimeout(r, 2500)); // Allow OpenStreetMap tiles and PostgreSQL data to settle

  console.log('Capturing Operations Center Desktop with Real Leaflet Map...');
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03_operations_center_desktop.png'),
    fullPage: false
  });

  // Capture full page of Operations Center
  console.log('Capturing full page Operations Center...');
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '04_operations_center_fullpage.png'),
    fullPage: true
  });

  // 3. Test Leaflet Marker Click and Popup
  console.log('Testing Leaflet incident pin click...');
  const markerClicked = await page.evaluate(() => {
    const pins = Array.from(document.querySelectorAll('.leaflet-pin-wrapper'));
    if (pins.length > 0) {
      pins[0].click();
      return true;
    }
    return false;
  });

  if (markerClicked) {
    await new Promise(r => setTimeout(r, 1000));
    console.log('Capturing Leaflet Marker Popup...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '08_leaflet_marker_popup.png'),
      fullPage: false
    });
  }

  // 4. Test "View full map" Modal
  console.log('Opening Full Interactive Map Modal...');
  await page.evaluate(() => {
    const fullMapLink = Array.from(document.querySelectorAll('span, button')).find(
      el => el.textContent?.includes('View full map')
    );
    if (fullMapLink) fullMapLink.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('Capturing Full Map Modal...');
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '09_leaflet_full_map_modal.png'),
    fullPage: false
  });

  // Test filter in Full Map Modal
  console.log('Testing filter in Full Map Modal...');
  await page.evaluate(() => {
    const select = document.querySelector('.full-map-select');
    if (select) {
      select.value = 'IN_PROGRESS';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '10_leaflet_full_map_filtered.png'),
    fullPage: false
  });

  // Close Full Map Modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.full-map-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 5. Test Table Row Click to Open Ticket Drawer
  console.log('Testing ticket drawer interaction from table...');
  await page.evaluate(() => {
    const firstRow = document.querySelector('.fixly-table tbody tr');
    if (firstRow) firstRow.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05_operations_center_ticket_drawer.png'),
    fullPage: false
  });

  // Close drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Fermer"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Fermer') || b.textContent?.includes('Close'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 6. Responsive Mobile Screenshots
  console.log('Capturing Mobile View (iPhone 14 / 390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  // Switch to Operations Center for mobile screenshot
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const opBtn = btns.find(b => b.textContent?.includes('Operations Center') || b.textContent?.includes('Dashboard Municipal'));
    if (opBtn) opBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Capturing Operations Center Mobile...');
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '06_operations_center_mobile.png'),
    fullPage: false
  });

  // Switch to Citizen Request for mobile screenshot
  console.log('Capturing Citizen Portal Mobile...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const citBtn = btns.find(b => b.textContent?.includes('Citizen Portal') || b.textContent?.includes('Citizen Request'));
    if (citBtn) citBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '07_citizen_portal_mobile.png'),
    fullPage: false
  });

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY in:', SCREENSHOT_DIR);
}

capture().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
