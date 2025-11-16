import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class UCIEngine {
  constructor(enginePath = path.join(__dirname, 'blunder.exe')) {
    this.enginePath = enginePath;
    this.process = null;
    this.ready = false;
    this.messageHandlers = [];
  }

  start() {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.enginePath);

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');
        
        lines.forEach(line => {
          line = line.trim();
          if (line) {
            console.log(`Engine: ${line}`);
            
            if (line === 'uciok') {
              this.ready = true;
              resolve();
            }
            
            this.messageHandlers.forEach(handler => handler(line));
          }
        });
      });

      this.process.stderr.on('data', (data) => {
        console.error(`Engine Error: ${data}`);
      });

      this.process.on('close', (code) => {
        console.log(`Engine process exited with code ${code}`);
        this.ready = false;
      });

      this.send('uci');
      
      setTimeout(() => {
        if (!this.ready) {
          reject(new Error('Engine failed to respond with uciok'));
        }
      }, 5000);
    });
  }

  send(command) {
    if (this.process && this.process.stdin.writable) {
      console.log(`> ${command}`);
      this.process.stdin.write(command + '\n');
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  async setPosition(fen) {
    this.send(`position fen ${fen}`);
  }

  async search(depth = 10, moveTime = 50) {
    return new Promise((resolve) => {
      let bestMove = null;
      
      const handler = (line) => {
        if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          bestMove = parts[1];
          
          const index = this.messageHandlers.indexOf(handler);
          if (index > -1) {
            this.messageHandlers.splice(index, 1);
          }
          
          resolve(bestMove);
        }
      };
      
      this.onMessage(handler);
      this.send(`go depth ${depth} movetime ${moveTime}`);
    });
  }

  async getBestMove(fen, depth = 2, moveTime = 50) {
    await this.setPosition(fen);
    return await this.search(depth, moveTime);
  }

  stop() {
    if (this.process) {
      this.send('quit');
      this.process.kill();
      this.process = null;
      this.ready = false;
    }
  }
}
