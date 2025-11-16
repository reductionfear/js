import CDP from 'chrome-remote-interface';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { UCIEngine } from './engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PORT = 9222;
const INJECT_SCRIPT_PATH = path.join(__dirname, 'inject.js');

let engine = null;

async function initEngine() {
  console.log('Initializing engine...');
  engine = new UCIEngine();
  await engine.start();
  console.log('✓ Engine ready');
}

async function injectIntoTab(client, injectCode) {
  try {
    const { Page, Runtime } = client;
    await Page.enable();
    await Page.setBypassCSP({ enabled: true });
    await Runtime.evaluate({ expression: injectCode });
    return true;
  } catch (error) {
    console.error(`▲ Failed to inject: ${error.message}`);
    return false;
  }
}

async function setupMessageListener(client) {
  const { Runtime } = client;
  
  Runtime.consoleAPICalled((params) => {
    const message = params.args.map(arg => arg.value).join(' ');
    console.log(`[Page] ${message}`);
  });

  await Runtime.enable();
  
  await Runtime.addBinding({ name: 'sendToBackend' });
  
  Runtime.bindingCalled(async (event) => {
    if (event.name === 'sendToBackend') {
      try {
        const data = JSON.parse(event.payload);
        
        if (data.type === 'CHESS_ANALYZER_REQUEST_MOVE' && engine) {
          console.log(`Calculating move for FEN: ${data.fen}`);
          const bestMove = await engine.getBestMove(data.fen, 2, 50);
          console.log(`Best move: ${bestMove}`);
          
          await Runtime.evaluate({
            expression: `window.postMessage({ type: 'CHESS_ANALYZER_BEST_MOVE', move: '${bestMove}' }, '*');`
          });
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    }
  });

  const bridgeCode = `
    (function() {
      window.addEventListener('message', function(event) {
        if (event.data.type === 'CHESS_ANALYZER_REQUEST_MOVE') {
          sendToBackend(JSON.stringify(event.data));
        }
      });
    })();
  `;
  
  await Runtime.evaluate({ expression: bridgeCode });
}

async function injectCode() {
  try {
    console.log('Connecting to Chrome...');
    const injectCode = fs.readFileSync(INJECT_SCRIPT_PATH, 'utf8');

    const response = await fetch(`http://localhost:${CHROME_PORT}/json`);
    const tabs = await response.json();

    const isChessPage = (url) =>
      url.includes('lichess.org');

    const chessTabs = tabs.filter(tab => tab.type === 'page' && isChessPage(tab.url));

    if (chessTabs.length > 0) {
      console.log(`Found ${chessTabs.length} chess tab(s), injecting code...`);
      let injectedCount = 0;

      for (const tab of chessTabs) {
        try {
          const client = await CDP({ port: CHROME_PORT, target: tab.id });
          const success = await injectIntoTab(client, injectCode);
          if (success) {
            console.log(`✓ Injected into: ${tab.url}`);
            await setupMessageListener(client);
            injectedCount++;
          }
        } catch (err) {
          console.log(`▲ Skipped tab (may be loading): ${tab.url}`);
        }
      }

      if (injectedCount > 0) {
        console.log(`\n✓ Successfully injected into ${injectedCount} tab(s)!`);
        console.log('Bot is now active. Play a game on Lichess!');
      } else {
        console.log('\n▲ No tabs were successfully injected (pages may still be loading)');
      }
    } else {
      console.log('No lichess.org tabs found. Please open Lichess in Chrome.');
    }
  } catch (error) {
    console.error(`✗ Injection error: ${error.message}`);
  }
}

async function main() {
  try {
    await initEngine();
    await injectCode();
    
    console.log('\nBot is running. Press Ctrl+C to stop.');
    
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      if (engine) {
        engine.stop();
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
