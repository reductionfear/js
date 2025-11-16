import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PORT = 9222;
const CHROME_LOCK_FILE = path.join(__dirname, '.chrome-analyzer-lock');

function getChromePath() {
  const platform = process.platform;
  
  if (platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    
    for (const p of paths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
  } else if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else {
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    for (const p of paths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
  }
  
  throw new Error('Chrome not found. Please install Google Chrome.');
}

async function checkChromeDebugActive() {
  try {
    const response = await fetch(`http://localhost:${CHROME_PORT}/json/version`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function launchChrome() {
  const chromePath = getChromePath();
  const userDataDir = path.join(__dirname, '.chrome-analyzer-profile');

  console.log('Launching Chrome with debugging...');
  console.log('Using dedicated profile for Chess Analyzer');
  console.log('TIP: Login to Lichess.org in this window — your login will be saved!');

  const chromeArgs = [
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://lichess.org/',
  ];

  try {
    const chromeProcess = spawn(chromePath, chromeArgs, { 
      detached: true, 
      stdio: 'ignore' 
    });
    chromeProcess.unref();

    console.log('Waiting for Chrome to start (this may take up to 30 seconds)...');

    let retries = 0;
    const maxRetries = 30;

    while (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const ready = await checkChromeDebugActive();

      if (ready) {
        console.log('✓ Chrome is ready!');
        fs.writeFileSync(CHROME_LOCK_FILE, Date.now().toString());
        return;
      }

      if (retries % 5 === 0 && retries > 0) {
        console.log(`Still waiting... (${retries}s elapsed)`);
      }

      retries++;
    }

    console.error('✗ Chrome failed to start within 30 seconds');
    throw new Error('Chrome startup timeout');
  } catch (error) {
    console.error(`✗ Error launching Chrome: ${error.message}`);
    throw error;
  }
}

launchChrome().catch(console.error);
