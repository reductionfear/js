# Architecture Diagram

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     External Lichess Bot                          │
│                     (Node.js Application)                         │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Component Layout                          │
└─────────────────────────────────────────────────────────────────┘

   Terminal 1              Terminal 2              Chrome Browser
   ──────────              ──────────              ──────────────
       │                       │                          │
       │                       │                          │
   ┌───▼────┐              ┌──▼────┐                ┌────▼─────┐
   │launcher│              │ index │                │ lichess  │
   │  .js   │              │  .js  │                │   .org   │
   └───┬────┘              └───┬───┘                └────┬─────┘
       │                       │                         │
       │ spawn Chrome          │                         │
       │ with debugging        │                         │
       │                       │                         │
       │                       │ CDP connect             │
       │                       ├────────────────────────>│
       │                       │ (port 9222)             │
       │                       │                         │
       │                       │ inject inject.js        │
       │                       ├────────────────────────>│
       │                       │                         │
       │                       │                         │
       │                   ┌───▼───┐                ┌────▼─────┐
       │                   │engine │                │ inject.js│
       │                   │  .js  │                │(injected)│
       │                   └───┬───┘                └────┬─────┘
       │                       │                         │
       │                       │                         │
       │                   ┌───▼────┐                   │
       │                   │blunder │                   │
       │                   │  .exe  │                   │
       │                   └────────┘                   │
       │                                                 │
       └─────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Play Flow                            │
└─────────────────────────────────────────────────────────────────┘

1. Game State Change
   ──────────────────
   Lichess Server
        │
        │ WebSocket message
        │ {t: "move", d: {fen: "...", ply: 5}}
        ▼
   inject.js (in page)
        │
        │ intercept & parse
        │
        ▼
   Extract FEN position
   Complete FEN (add castling, etc.)


2. Request Analysis
   ────────────────
   inject.js
        │
        │ postMessage (CHESS_ANALYZER_REQUEST_MOVE)
        │ {type: "...", fen: "r1bqkb..."}
        ▼
   Runtime binding bridge
        │
        │ sendToBackend()
        │
        ▼
   index.js (Node.js)


3. Engine Calculation
   ──────────────────
   index.js
        │
        │ engine.getBestMove(fen, depth, time)
        │
        ▼
   engine.js
        │
        │ UCI commands:
        │ "position fen r1bqkb..."
        │ "go depth 2 movetime 50"
        │
        ▼
   blunder.exe
        │
        │ Calculate...
        │
        │ "bestmove e2e4"
        ▼
   engine.js
        │
        │ parse & return
        │
        ▼
   index.js


4. Play Move
   ──────────
   index.js
        │
        │ Runtime.evaluate()
        │ postMessage(CHESS_ANALYZER_BEST_MOVE)
        │
        ▼
   inject.js
        │
        │ makeMove(bestMove)
        │
        │ WebSocket send
        │ {t: "move", d: {u: "e2e4", ...}}
        │
        ▼
   Lichess Server
        │
        │ Move played!
        │
        ▼
   Go to step 1 (opponent's turn)
```

## Message Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│              Page ↔ Node.js Communication                        │
└─────────────────────────────────────────────────────────────────┘

Page → Node.js (Request):
─────────────────────────
window.postMessage({
  type: 'CHESS_ANALYZER_REQUEST_MOVE',
  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
}, '*')
    ↓
sendToBackend(JSON.stringify(data))
    ↓
Runtime.bindingCalled event in index.js


Node.js → Page (Response):
──────────────────────────
Runtime.evaluate({
  expression: "window.postMessage({
    type: 'CHESS_ANALYZER_BEST_MOVE', 
    move: 'e7e5'
  }, '*');"
})
    ↓
window.addEventListener('message') in inject.js
    ↓
makeMove('e7e5')
```

## UCI Protocol Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 UCI Engine Communication                         │
└─────────────────────────────────────────────────────────────────┘

Initialization:
──────────────
Node.js                          blunder.exe
   │                                  │
   │ spawn()                          │
   ├─────────────────────────────────>│
   │                                  │
   │ "uci"                            │
   ├─────────────────────────────────>│
   │                                  │
   │                            "uciok"
   │<─────────────────────────────────┤
   │                                  │


Move Calculation:
────────────────
   │                                  │
   │ "position fen rnbqkb..."         │
   ├─────────────────────────────────>│
   │                                  │
   │ "go depth 2 movetime 50"         │
   ├─────────────────────────────────>│
   │                                  │
   │                         Thinking...
   │                                  │
   │      "info depth 1 score cp 30"  │
   │<─────────────────────────────────┤
   │      "info depth 2 score cp 28"  │
   │<─────────────────────────────────┤
   │      "bestmove e2e4 ponder e7e5" │
   │<─────────────────────────────────┤
   │                                  │


Shutdown:
────────
   │ "quit"                           │
   ├─────────────────────────────────>│
   │                                  │
   │                            Process exits
   │                                  X
```

## WebSocket Interception

```
┌─────────────────────────────────────────────────────────────────┐
│             Lichess WebSocket Interception                       │
└─────────────────────────────────────────────────────────────────┘

Original Flow (Without Bot):
───────────────────────────
Lichess Page → WebSocket → Lichess Server


With Bot (Proxied):
──────────────────
                    ┌─────────────┐
Lichess Page ──────>│ Proxy       │
                    │ (inject.js) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
         Intercept                  Forward
         Messages                   Original
              │                         │
              ▼                         ▼
         Extract FEN              Lichess Server
         Calculate Move
         Send Move
              │
              └────────────────────────>


Message Types Intercepted:
─────────────────────────
✓ {t: "d", d: {fen: "...", ply: ...}}      - Game state
✓ {t: "move", d: {fen: "...", ply: ...}}   - Move update
✗ {t: "clockInc", ...}                     - Ignored
✗ {t: "crowd", ...}                        - Ignored
✓ {type: "gameFull", id: "..."}            - Game start
✓ {type: "gameState", status: 30}          - Game end
```

## File Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    File Dependency Graph                         │
└─────────────────────────────────────────────────────────────────┘

launcher.js (standalone)
    │
    └── Spawns Chrome with debugging


index.js
    ├── import engine.js
    │       └── Manages blunder.exe
    │
    ├── import CDP (chrome-remote-interface)
    │       └── Connects to Chrome
    │
    └── reads inject.js
            └── Injects into page


inject.js (injected into page)
    ├── Intercepts WebSocket
    ├── Extracts FEN
    └── Plays moves


package.json
    ├── Defines dependencies
    └── Defines scripts
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Handling                              │
└─────────────────────────────────────────────────────────────────┘

launcher.js:
───────────
Chrome not found        → Error: "Chrome not found. Please install..."
Startup timeout (30s)   → Error: "Chrome startup timeout"
Spawn error            → Error: "Error launching Chrome: ..."


index.js:
────────
Engine init fail       → Error + exit
CDP connection fail    → Error: "Injection error: ..."
No tabs found          → Warning: "No lichess.org tabs found"
Injection fail         → Warning: "Skipped tab (may be loading)"


engine.js:
─────────
UCI timeout (5s)       → Error: "Engine failed to respond"
Process crash          → Log: "Engine process exited with code X"
Invalid command        → Continue (engine handles)


inject.js:
─────────
WebSocket error        → Silent (browser handles)
JSON parse error       → Return early (ignore message)
No WebSocket           → Warning (can't play move)
```
