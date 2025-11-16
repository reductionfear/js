# Quick Start Guide

Follow these steps to get the External Lichess Bot running:

## 1. Install Dependencies

```bash
npm install
```

## 2. Launch Chrome with Debugging

Open a terminal and run:

```bash
npm run launch
```

Or:

```bash
node launcher.js
```

This will:
- Launch Chrome with debugging enabled
- Open https://lichess.org/
- Save your session in a dedicated profile

**Login to Lichess** in this Chrome window. Your login will be saved for future sessions.

## 3. Start the Bot

Open a **second terminal** and run:

```bash
npm start
```

Or:

```bash
node index.js
```

You should see:
```
Initializing engine...
Engine: Stockfish...
✓ Engine ready
Connecting to Chrome...
Found 1 chess tab(s), injecting code...
✓ Injected into: https://lichess.org/...
✓ Successfully injected into 1 tab(s)!
Bot is now active. Play a game on Lichess!
```

## 4. Play a Game

In the Chrome window that was launched:

1. Go to https://lichess.org/
2. Click "Play with the computer" or "Play with a friend"
3. Start a game

The bot will automatically:
- Detect the game state
- Calculate moves using the engine
- Play moves automatically

## Stopping the Bot

Press `Ctrl+C` in the terminal running `npm start` to stop the bot.

You can close the Chrome window or press `Ctrl+C` in the launcher terminal to stop Chrome.

## Troubleshooting

### "Chrome not found"
- Make sure Google Chrome is installed
- Update the path in `launcher.js` if needed

### "No lichess.org tabs found"
- Make sure you ran `npm run launch` first
- Open https://lichess.org/ in the Chrome window that was launched
- Wait a few seconds and try `npm start` again

### Bot not making moves
- Check that you're logged into Lichess
- Try starting a new game
- Check the console for error messages

### Engine errors on Linux/Mac
- `blunder.exe` is a Windows executable
- You'll need a Linux/Mac compatible UCI engine
- Update the engine path in `engine.js`:
  ```javascript
  constructor(enginePath = path.join(__dirname, 'stockfish')) {
  ```

## Using a Different Engine

To use a different UCI-compatible engine:

1. Place the engine executable in the repository directory
2. Edit `engine.js`:
   ```javascript
   constructor(enginePath = path.join(__dirname, 'your-engine-name')) {
   ```
3. Restart the bot

Popular UCI engines:
- Stockfish (strongest)
- Komodo
- Leela Chess Zero
- blunder.exe (included, weaker but faster)

## Configuration

### Change Engine Strength

Edit `index.js`, line 55:
```javascript
const bestMove = await engine.getBestMove(data.fen, 10, 1000);
//                                               ^^  ^^^^
//                                              depth  time(ms)
```

Higher depth = stronger but slower
More time = stronger but slower

### Disable Auto-Play

Edit `inject.js` and remove or comment out the `makeMove()` call to just analyze without playing.

## Notes

- This bot is for educational purposes
- Using bots on Lichess may violate their Terms of Service
- The bot works best with correspondence or longer time control games
- Blitz/Bullet games may be too fast for the engine to calculate
