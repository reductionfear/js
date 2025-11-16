Lichess Bot (stockfish8) 2.js  is working for lichess.org
use electron so its all external
no browser extension needed chrome in debug mode then inject code
can use compiled executable engines example blunder.exe not only js
features may be multiple arrows different colors for best 4 moves with say least cp losing moves
automove just like Lichess Bot (stockfish8) 2.js

examples-

async launchChrome() {
const chromePath = this.getChromePath();
const userDataDir path.join(_dirname, '../.chrome-analyzer-profile');
console.log(' Launching Chrome with debugging...');
console.log(' Using dedicated profile for Chess Analyzer');
console.log(' TIP: Login to Chess.com in this window your login will be saved!');
const chromeArgs = [
*--remote-debugging-port=${CHROME_PORT}`,
--user-data-dir=${userDataDir},
'--no-first-run',
'--no-default-browser-check',
'https://www.chess.com/play/online',
];
try {
const chromeProcess = spawn (chromePath, chromeArgs, {
detached: true,
stdio: 'ignore'
chromeProcess.unref();
});
console.log('X Waiting for Chrome to start (this may take up to 30 seconds)...');
let retries = 0;
const maxRetries = 30;
while (retries < maxRetries) {
await new Promise(resolve => setTimeout(resolve, 1000));
const ready await this.checkChromeDebugActive();
if (ready) {
}
console.log('✓ Chrome is ready!');
fs.writeFileSync (CHROME_LOCK_FILE, Date.now().toString());
return;
if (retries % 5 === 0 && retries > 0) {
}
console.log(" Still waiting... (${retries}s elapsed)`);
retries++;
}
console.error('X Chrome failed to start within 30 seconds');
throw new Error('Chrome startup timeout');
} catch (error) {
console.error("X Frror launching Chrome: error.message):




async injectIntoTab(client, injectCode) {
try {
const { Page, Runtime} = client;
await Page.enable();
await Page.setBypassCSP({ enabled: true });
await Runtime.evaluate({ expression: injectCode));
return true;
} catch (error) {
console.error(`
▲
Failed to inject: ${error.message}');
return false;



async injectCode()
try {
console.log( Connecting to Chrome...');
const injectCode = fs.readFileSync (INJECT_SCRIPT_PATH, 'utf8');
const response = await fetch('http://localhost:${CHROME_PORT}/json');
const tabs = await response.json();
const chessTabsCount = tabs.filter(tab =>
tab.type === 'page' &&
(tab.url.includes('chess.com') || tab.url.includes('lichess.org'))
).length;
if (chessTabsCount > 0) {
console.log( Found ${chess TabsCount) chess tab(s) injecting code...");
Let injectedCount = 0;
for (const tab of tabs) {
if (tab.type === 'page' &&
(tab.url.includes('chess.com') || tab.url.includes('lichess.org'))) {
try {
const client = await CDP(( port: CHROME_PORT, target: tab.id));
const success = await this.injectIntoTab(client, injectCode);
if (success) {
console.log("
Injected into: ${tab.url}');
injectedCount++;
await client.close();
} catch (err) {
console.log(`^
▲ Skipped tab (may be loading): $(tab.url}');
}
}
if (injectedCount > 0) {
console.log("\n Successfully injected into ${injectedCount} tab(s)!`);
} else {
console.log('\nA No tabs were successfully injected (pages may still be loading)');
} else {
