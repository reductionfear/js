# Project Manifest

## External Lichess Bot - File List

This document lists all files created for the External Lichess Bot project.

## Core Application Files

### 1. package.json
- **Purpose**: Node.js project configuration
- **Contents**: Dependencies, scripts, metadata
- **Dependencies**: chrome-remote-interface (^0.33.2)
- **Scripts**: 
  - `npm start` - Run the bot
  - `npm run launch` - Launch Chrome with debugging

### 2. launcher.js
- **Purpose**: Launch Chrome with remote debugging
- **Key Features**:
  - Cross-platform Chrome detection (Win/Mac/Linux)
  - Spawns Chrome with `--remote-debugging-port=9222`
  - Dedicated profile for persistent login
  - 30-second startup timeout with retries
  - Opens Lichess.org automatically
- **Usage**: `node launcher.js` or `npm run launch`

### 3. index.js
- **Purpose**: Main application coordinator
- **Key Features**:
  - Initializes UCI engine
  - Connects to Chrome via CDP
  - Injects code into Lichess tabs
  - Sets up bidirectional messaging
  - Handles SIGINT for graceful shutdown
- **Usage**: `node index.js` or `npm start`

### 4. engine.js
- **Purpose**: UCI protocol engine interface
- **Key Features**:
  - Spawns engine process (blunder.exe)
  - UCI command interface
  - Async/await move calculation
  - Message handler system
  - Process cleanup
- **Exports**: UCIEngine class

### 5. inject.js
- **Purpose**: Script injected into Lichess pages
- **Key Features**:
  - WebSocket interception via Proxy
  - FEN extraction from game state
  - FEN completion (castling, en passant)
  - postMessage communication
  - Auto-move execution
  - Game end handling
- **Injected by**: index.js via CDP

### 6. .gitignore
- **Purpose**: Git exclusion rules
- **Excludes**:
  - node_modules/
  - .chrome-analyzer-profile/
  - .chrome-analyzer-lock
  - *.log
  - .DS_Store

## Documentation Files

### 7. README.md
- **Purpose**: Complete user documentation
- **Sections**:
  - Features
  - Architecture overview
  - Prerequisites
  - Installation
  - Usage (step-by-step)
  - How it works
  - Configuration
  - Files description
  - Troubleshooting
  - Legal notice
- **Audience**: End users

### 8. QUICKSTART.md
- **Purpose**: Quick start guide
- **Sections**:
  - Installation
  - Step-by-step usage
  - Playing a game
  - Stopping the bot
  - Troubleshooting
  - Using different engines
  - Configuration tips
- **Audience**: New users

### 9. IMPLEMENTATION.md
- **Purpose**: Technical implementation details
- **Sections**:
  - Objective
  - Project structure
  - Core functionality
  - Key features
  - How it works (detailed)
  - Differences from userscript
  - Technologies used
  - Advantages
  - Compliance checklist
- **Audience**: Developers

### 10. ARCHITECTURE.md
- **Purpose**: System architecture documentation
- **Sections**:
  - System overview diagram
  - Component layout diagram
  - Data flow diagram
  - Message protocol
  - UCI protocol flow
  - WebSocket interception
  - File dependencies
  - Error handling
- **Audience**: Developers, contributors

### 11. COMPARISON.md
- **Purpose**: Userscript vs External App comparison
- **Sections**:
  - Side-by-side code comparison
  - Feature comparison table
  - Technical differences
  - Performance comparison
  - Advantages of each approach
  - Migration path
  - Use cases
- **Audience**: Users deciding between approaches

## Existing Files (Used by Bot)

### 12. blunder.exe
- **Purpose**: UCI chess engine
- **Type**: Windows executable
- **Usage**: Default engine for the bot
- **Note**: Replace with platform-specific engine on Mac/Linux

## File Statistics

| Category | Files | Total Lines |
|----------|-------|-------------|
| Core Application | 5 | ~500 |
| Documentation | 5 | ~600 |
| Configuration | 2 | ~30 |
| **Total** | **12** | **~1,130** |

## Dependency Tree

```
launcher.js (standalone)
    └── Spawns Chrome

index.js
    ├── import engine.js
    │       └── Uses blunder.exe
    ├── import chrome-remote-interface
    └── reads inject.js

inject.js (standalone, injected)

package.json
    └── Defines dependencies
```

## File Size Breakdown

| File | Size | Purpose |
|------|------|---------|
| package.json | ~0.4 KB | Config |
| launcher.js | ~2.9 KB | Chrome launcher |
| index.js | ~4.1 KB | Main app |
| engine.js | ~2.7 KB | UCI interface |
| inject.js | ~4.0 KB | Injection script |
| .gitignore | ~0.1 KB | Git config |
| README.md | ~4.1 KB | User docs |
| QUICKSTART.md | ~3.1 KB | Quick guide |
| IMPLEMENTATION.md | ~5.9 KB | Tech docs |
| ARCHITECTURE.md | ~9.6 KB | Architecture |
| COMPARISON.md | ~6.4 KB | Comparison |
| **Total** | **~43.3 KB** | All files |

## Installation Footprint

| Component | Size | Location |
|-----------|------|----------|
| Application Files | ~43 KB | Repository root |
| node_modules | ~2-5 MB | After `npm install` |
| Chrome Profile | Varies | `.chrome-analyzer-profile/` |
| Engine (blunder.exe) | ~1 MB | Repository root |
| **Total** | **~3-6 MB** | Full installation |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release |
|       |      | - External app creation |
|       |      | - UCI engine support |
|       |      | - Chrome debugging |
|       |      | - Complete documentation |

## License

ISC (as specified in package.json)

## Related Files (Existing in Repo)

These files were already in the repository and are not part of this project:

- `Lichess Bot (stockfish8) 2` - Original userscript (inspiration)
- `Lichess Bot v5` - Another userscript variant
- `script.user.js` - Another bot script
- `newengine1.js` - Engine implementation
- `stockfish10.js` - Stockfish JavaScript engine
- `stockfish5.js` - Stockfish JavaScript engine
- `README-COPILOT.md` - Copilot documentation
- `claude.md` - Claude documentation
- `.github/` - GitHub configuration

## Maintenance

### To update the bot:
```bash
git pull
npm install
```

### To use a different engine:
1. Place engine in repository
2. Update `engine.js` constructor
3. Restart bot

### To modify behavior:
- **Engine settings**: Edit `engine.js`
- **Injection logic**: Edit `inject.js`
- **Chrome launch**: Edit `launcher.js`
- **Coordination**: Edit `index.js`

## Support

For issues, questions, or contributions, see the documentation files above.
