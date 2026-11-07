import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const ARCH_HTML = 'file:///C:/Users/mukul/arch_view.html'; // we will copy architecture html locally or file URL

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function recordSceneCDP({
  browser,
  url,
  durationSec,
  outputWslPath,
  setup,
  actions
}) {
  console.log(`\n==================================================`);
  console.log(`RECORDING SCENE: ${path.basename(outputWslPath)} (${durationSec}s)`);
  console.log(`URL: ${url}`);
  console.log(`==================================================`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Navigate
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 }).catch(async (e) => {
    console.log(`[nav warning] ${e.message}, falling back to domcontentloaded`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  });

  if (setup) {
    await setup(page);
  }

  // Spawn WSL ffmpeg
  const ffmpeg = spawn('wsl', [
    '-d', 'Ubuntu', '--',
    'ffmpeg', '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    outputWslPath
  ]);

  ffmpeg.stderr.on('data', () => {});

  const client = await page.target().createCDPSession();
  let frameCount = 0;

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    frameCount++;
    const buf = Buffer.from(data, 'base64');
    try {
      ffmpeg.stdin.write(buf);
    } catch (err) {}
    await client.send('Page.screencastFrameAck', { sessionId });
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1
  });

  const startTime = Date.now();
  const targetMs = durationSec * 1000;

  // Execute interactive actions in parallel
  if (actions) {
    actions(page).catch(console.error);
  }

  // Keep recording until target duration is met
  while (Date.now() - startTime < targetMs) {
    await sleep(200);
  }

  await client.send('Page.stopScreencast');
  ffmpeg.stdin.end();

  await new Promise((resolve) => {
    ffmpeg.on('close', (code) => {
      console.log(`Scene ${path.basename(outputWslPath)} finished: ${frameCount} frames, exit code ${code}`);
      resolve();
    });
  });

  await page.close();
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--force-device-scale-factor=1',
      '--allow-file-access-from-files'
    ]
  });

  console.log('Connected to Chrome:', await browser.version());

  // Copy Archify HTML to C:\Users\mukul\arch_view.html for instant local access
  try {
    const archSrc = '\\\\wsl.localhost\\Ubuntu\\home\\devcontainers\\Projects\\Active\\Switch-Hacka\\docs\\devops-ai-command-center-architecture.html';
    const archDest = 'C:\\Users\\mukul\\arch_view.html';
    if (fs.existsSync(archSrc)) {
      fs.copyFileSync(archSrc, archDest);
      console.log('Copied Archify architecture html to Windows host');
    }
  } catch (err) {
    console.warn('Could not copy arch html:', err.message);
  }

  // Base output dir in WSL
  const outDir = '/home/devcontainers/Projects/Active/Switch-Hacka/submission/demo/RAW_RECORDINGS';

  // SCENE 1: Cinematic Opening (20s)
  await recordSceneCDP({
    browser,
    url: 'file:///C:/Users/mukul/scene1_opening.html',
    durationSec: 20,
    outputWslPath: `${outDir}/scene01_opening.mp4`,
    setup: async (page) => {},
    actions: async (page) => {
      for (let i = 0; i < 20; i++) {
        await page.mouse.move(960 + Math.sin(i / 3) * 60, 540 + Math.cos(i / 3) * 30);
        await sleep(1000);
      }
    }
  });

  // SCENE 2: The Real-World Problem (25s)
  await recordSceneCDP({
    browser,
    url: 'file:///C:/Users/mukul/scene2_problem.html',
    durationSec: 25,
    outputWslPath: `${outDir}/scene02_problem.mp4`,
    setup: async (page) => {},
    actions: async (page) => {
      await sleep(2000);
      // Pan cursor across terminal and callout cards
      for (let i = 0; i < 23; i++) {
        await page.mouse.move(400 + (i % 2 === 0 ? 800 : 0), 300 + (i * 25) % 500);
        await sleep(1000);
      }
    }
  });

  // SCENE 3: Command Center Cockpit (35s)
  await recordSceneCDP({
    browser,
    url: `${BASE_URL}/`,
    durationSec: 35,
    outputWslPath: `${outDir}/scene03_cockpit.mp4`,
    setup: async (page) => {
      await sleep(1000);
    },
    actions: async (page) => {
      await sleep(2000);
      // Hover over MTTR card
      await page.mouse.move(350, 200, { steps: 20 });
      await sleep(3000);
      // Hover over Automated Pass Rate card
      await page.mouse.move(650, 200, { steps: 20 });
      await sleep(3000);
      // Hover over Production Microservices grid
      await page.mouse.move(1200, 350, { steps: 25 });
      await sleep(4000);
      // Scroll slightly to view active incident queue
      await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
      await sleep(3000);
      // Hover over INC-2847
      await page.mouse.move(600, 600, { steps: 20 });
      await sleep(5000);
      // Scroll back up
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await sleep(4000);
    }
  });

  // SCENE 4: Switch and Agent Orchestration (35s)
  await recordSceneCDP({
    browser,
    url: `${BASE_URL}/`,
    durationSec: 35,
    outputWslPath: `${outDir}/scene04_switch.mp4`,
    setup: async (page) => {},
    actions: async (page) => {
      await sleep(2000);
      // Move to Switch status badge in sidebar
      await page.mouse.move(120, 950, { steps: 25 });
      await sleep(4000);
      // Click on Agents squad navigation item
      const agentsNav = await page.$('button[data-nav="agents"], a[href*="agents"], nav button:nth-child(4)');
      if (agentsNav) {
        await agentsNav.click();
      } else {
        // Fallback: evaluate click
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent?.includes('Agents'));
          btn?.click();
        });
      }
      await sleep(3000);
      // Hover across 4 agents: Incident Manager, Log Analyzer, Code Fixer, Testing Agent
      await page.mouse.move(400, 300, { steps: 20 });
      await sleep(4000);
      await page.mouse.move(800, 300, { steps: 20 });
      await sleep(4000);
      await page.mouse.move(1200, 300, { steps: 20 });
      await sleep(4000);
      await page.mouse.move(1600, 300, { steps: 20 });
      await sleep(4000);
    }
  });

  // SCENE 5: Telegram War Room (55s)
  await recordSceneCDP({
    browser,
    url: 'file:///C:/Users/mukul/scene5_telegram.html',
    durationSec: 55,
    outputWslPath: `${outDir}/scene05_telegram.mp4`,
    setup: async (page) => {},
    actions: async (page) => {
      // Step-by-step reading and mouse movement following messages
      await sleep(2000);
      // Cursor follows operator message
      await page.mouse.move(1200, 220, { steps: 20 });
      await sleep(4000);
      // Follow Incident Manager triage
      await page.mouse.move(750, 320, { steps: 20 });
      await sleep(5000);
      // Follow Log Analyzer stack trace
      await page.mouse.move(750, 480, { steps: 20 });
      await sleep(6000);
      // Follow Code Fixer diff patch
      await page.mouse.move(750, 650, { steps: 25 });
      await sleep(8000);
      // Follow Testing Agent sandbox verification
      await page.mouse.move(750, 850, { steps: 25 });
      await sleep(8000);
      // Move to and click [ Approve & Deploy ] button
      await page.mouse.move(630, 930, { steps: 20 });
      await sleep(3000);
      // Hover over resolution message
      await page.mouse.move(750, 950, { steps: 15 });
      await sleep(8000);
    }
  });

  // SCENE 6: Code Fixer & Code Review (35s)
  await recordSceneCDP({
    browser,
    url: `${BASE_URL}/`,
    durationSec: 35,
    outputWslPath: `${outDir}/scene06_codereview.mp4`,
    setup: async (page) => {
      // Navigate to Code Review tab
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent?.includes('Code Review') || b.textContent?.includes('Review'));
        btn?.click();
      });
      await sleep(1500);
    },
    actions: async (page) => {
      await sleep(2000);
      // Inspect diff header
      await page.mouse.move(500, 250, { steps: 20 });
      await sleep(4000);
      // Scroll through Unified Diff Viewer additions and deletions
      await page.mouse.move(700, 450, { steps: 20 });
      await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
      await sleep(6000);
      // Inspect AST Root Cause explanation card
      await page.mouse.move(1400, 350, { steps: 25 });
      await sleep(6000);
      // Highlight defensive optional chaining lines
      await page.mouse.move(700, 500, { steps: 15 });
      await sleep(6000);
    }
  });

  // SCENE 7: Testing Sandbox & Verification (30s)
  await recordSceneCDP({
    browser,
    url: `${BASE_URL}/`,
    durationSec: 30,
    outputWslPath: `${outDir}/scene07_testing.mp4`,
    setup: async (page) => {
      // Navigate to Incidents or Code Review
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent?.includes('Incidents'));
        btn?.click();
      });
      await sleep(1500);
    },
    actions: async (page) => {
      await sleep(2000);
      // Click on INC-2847 row to inspect details
      await page.evaluate(() => {
        const row = Array.from(document.querySelectorAll('tr, div, li')).find(el => el.textContent?.includes('INC-2847'));
        row?.click();
      });
      await sleep(3000);
      // Pan over test execution stats
      await page.mouse.move(800, 450, { steps: 20 });
      await sleep(5000);
      await page.mouse.move(1100, 450, { steps: 20 });
      await sleep(5000);
    }
  });

  // SCENE 8: Human Sign-Off Gate & Resolution (30s)
  await recordSceneCDP({
    browser,
    url: `${BASE_URL}/`,
    durationSec: 30,
    outputWslPath: `${outDir}/scene08_signoff.mp4`,
    setup: async (page) => {
      await sleep(1000);
    },
    actions: async (page) => {
      await sleep(2000);
      // Click Sign-Off Gate button in raycast dock
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Sign-Off Gate') || b.textContent?.includes('Approve'));
        btn?.click();
      });
      await sleep(3000);
      // Hover over approval dialog details
      await page.mouse.move(960, 500, { steps: 20 });
      await sleep(4000);
      // Click Confirm Approval
      await page.evaluate(() => {
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Confirm Approval') || b.textContent?.includes('Approve & Deploy'));
        confirmBtn?.click();
      });
      await sleep(4000);
      // Observe updated status badge and MTTR
      await page.mouse.move(350, 200, { steps: 20 });
      await sleep(6000);
    }
  });

  // SCENE 9: Architecture & Product Value (25s)
  await recordSceneCDP({
    browser,
    url: 'file:///C:/Users/mukul/arch_view.html',
    durationSec: 25,
    outputWslPath: `${outDir}/scene09_architecture.mp4`,
    setup: async (page) => {
      await sleep(2000);
    },
    actions: async (page) => {
      // Pan across Archify architecture diagram nodes
      await page.mouse.move(400, 400, { steps: 25 });
      await sleep(4000);
      await page.mouse.move(800, 400, { steps: 25 });
      await sleep(4000);
      await page.mouse.move(1200, 400, { steps: 25 });
      await sleep(4000);
      await page.mouse.move(1000, 700, { steps: 25 });
      await sleep(4000);
    }
  });

  // SCENE 10: Final Closing (15s)
  await recordSceneCDP({
    browser,
    url: 'file:///C:/Users/mukul/scene10_closing.html',
    durationSec: 15,
    outputWslPath: `${outDir}/scene10_closing.mp4`,
    setup: async (page) => {},
    actions: async (page) => {
      await sleep(2000);
      await page.mouse.move(960, 540, { steps: 20 });
      await sleep(5000);
    }
  });

  await browser.close();
  console.log('\n==================================================');
  console.log('ALL 10 SCENES RECORDED SUCCESSFULLY!');
  console.log('==================================================\n');
}

main().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});

