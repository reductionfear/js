# External Lichess Bot

An external Lichess bot application that uses prebuilt executable engines and Chrome debugging protocol.

## Features

- **External Engine Support**: Uses prebuilt executable chess engines (like `blunder.exe`) via UCI protocol
- **Chrome Remote Debugging**: Controls Chrome browser to inject code into Lichess.org
- **Automated Play**: Automatically plays chess games on Lichess
- **Based on**: Lichess Bot (stockfish8) 2 logic

## Architecture

This application consists of three main components:

1. **Launcher** (`launcher.js`): Launches Chrome with remote debugging enabled
2. **Engine Interface** (`engine.js`): Communicates with external UCI engines
3. **Main Application** (`index.js`): Injects code into Lichess pages and coordinates gameplay

## Prerequisites

- Node.js (v14 or higher)
- Google Chrome browser
- A UCI-compatible chess engine (e.g., `blunder.exe` included in repository)

## Installation

```bash
npm install
```

## Usage

### Step 1: Launch Chrome with Debugging

In one terminal window:

```bash
node launcher.js
```

This will:
- Launch Chrome with remote debugging on port 9222
- Open Lichess.org
- Use a dedicated Chrome profile (login will be saved)

**Important**: Login to your Lichess account in this Chrome window.

### Step 2: Start the Bot

In another terminal window:

```bash
npm start
# or
node index.js
```

This will:
- Initialize the chess engine (blunder.exe)
- Connect to Chrome via debugging protocol
- Inject the bot script into Lichess tabs
- Start playing automatically

### Step 3: Play Chess

Navigate to a game on Lichess (or start a new game). The bot will automatically:
- Detect game state changes
- Calculate best moves using the external engine
- Play moves automatically

## How It Works

### 1. Chrome Debugging Connection

```javascript
launchChrome() → Chrome with --remote-debugging-port=9222
```

The launcher spawns Chrome with debugging enabled and waits for it to be ready.

### 2. Code Injection

```javascript
injectCode() → injectIntoTab(client, injectCode)
```

The main application:
- Connects to Chrome's debugging port
- Finds Lichess.org tabs
- Injects the analyzer script
- Sets up message passing between page and Node.js

### 3. Game Play Loop

```
Lichess WebSocket → Inject Script → postMessage → Node.js → UCI Engine → Best Move → postMessage → Inject Script → WebSocket → Lichess
```

1. Inject script intercepts Lichess WebSocket messages
2. Extracts FEN position from game state
3. Sends position to Node.js via postMessage
4. Node.js sends FEN to UCI engine
5. Engine calculates best move
6. Best move sent back to inject script
7. Inject script sends move via WebSocket

## Configuration

### Engine Settings

Edit `engine.js` to change:
- Engine path (default: `blunder.exe`)
- Search depth (default: 2)
- Move time (default: 50ms)

### Bot Behavior

Edit `inject.js` to change:
- Time controls for new games
- Auto-rematch behavior
- Move delay

## Files

- `package.json` - Node.js package configuration
- `launcher.js` - Chrome launcher with debugging
- `engine.js` - UCI engine interface
- `inject.js` - Script injected into Lichess pages
- `index.js` - Main application coordinator
- `blunder.exe` - Example UCI engine (Windows)

## Troubleshooting

### Chrome doesn't start
- Check that Chrome is installed
- Try specifying Chrome path manually in `launcher.js`

### No tabs found
- Make sure Chrome was launched with `launcher.js`
- Open Lichess.org in the Chrome window that was launched
- Wait a few seconds and run `node index.js` again

### Engine errors
- Ensure `blunder.exe` (or your engine) is in the repository directory
- On Linux/Mac, you may need to compile or use a different engine
- Check that the engine supports UCI protocol

### Moves not playing
- Check that you're logged into Lichess
- Start a new game (bot works best with correspondence or longer time controls)
- Check console logs for errors

## Legal Notice

This bot is for educational purposes only. Using bots on Lichess may violate their Terms of Service. Use at your own risk.

## License

ISC
