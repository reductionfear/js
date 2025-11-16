// This script will be injected into Lichess pages
(function() {
  console.log('[Inject] Initializing Chess Analyzer for Lichess');

  let currentFen = "";
  let webSocketWrapper = null;
  let gameId = null;
  let isWhite = true;
  const timeLimitMs = 50;

  function completeFen(partialFen) {
    let fenParts = partialFen.split(' ');
    
    if (fenParts.length === 6) {
      return partialFen;
    }
    
    if (fenParts.length === 2) {
      fenParts.push('KQkq');
    }
    
    if (fenParts.length === 3) {
      fenParts.push('-');
    }
    
    if (fenParts.length === 4) {
      fenParts.push('0');
    }
    
    if (fenParts.length === 5) {
      fenParts.push('1');
    }
    
    return fenParts.join(' ');
  }

  function interceptWebSocket() {
    let webSocket = window.WebSocket;
    const webSocketProxy = new Proxy(webSocket, {
      construct: function (target, args) {
        let wrappedWebSocket = new target(...args);
        webSocketWrapper = wrappedWebSocket;

        wrappedWebSocket.addEventListener("message", function (event) {
          let message;
          try {
            message = JSON.parse(event.data);
          } catch (e) {
            return;
          }

          if (message.type === "gameFull" && message.id) {
            gameId = message.id;
            if (window.lichess && window.lichess.socket && window.lichess.socket.settings) {
              isWhite = message.white.id === window.lichess.socket.settings.userId;
            }
            console.log("[Inject] Game ID:", gameId);
            console.log("[Inject] Playing as white:", isWhite);
          }

          if (message.type === "gameState" && message.status >= 30) {
            handleGameEnd();
          }

          switch (message.t) {
            case 'd':
            case 'move':
              console.log("[Inject] Received game state/move update:", message.t);

              if (message.d && typeof message.d.fen === "string") {
                currentFen = message.d.fen;

                let isWhitesTurn = message.d.ply % 2 === 0;

                if (isWhitesTurn) {
                  currentFen += " w";
                } else {
                  currentFen += " b";
                }

                currentFen = completeFen(currentFen);
                console.log("[Inject] Got FEN:", currentFen);

                calculateMove();
              }
              break;

            case 'clockInc':
              break;

            case 'crowd':
            case 'mlat':
              break;

            default:
              break;
          }
        });

        return wrappedWebSocket;
      }
    });

    window.WebSocket = webSocketProxy;
    console.log('[Inject] WebSocket interceptor installed');
  }

  function calculateMove() {
    window.postMessage({
      type: 'CHESS_ANALYZER_REQUEST_MOVE',
      fen: currentFen
    }, '*');
  }

  function makeMove(bestMove) {
    if (webSocketWrapper && bestMove) {
      webSocketWrapper.send(JSON.stringify({
        t: "move",
        d: { u: bestMove, b: 1, l: 10000, a: 1 }
      }));
      console.log("[Inject] Made move:", bestMove);
    }
  }

  function handleGameEnd() {
    console.log("[Inject] Game ended, initiating new opponent...");
    if (webSocketWrapper) {
      webSocketWrapper.send(JSON.stringify({ 
        t: 'challenge', 
        d: { 
          dest: 'auto', 
          rated: false, 
          clock: { limit: 60, increment: 5, emerg: 30 } 
        } 
      }));
    }
  }

  window.addEventListener('message', function(event) {
    if (event.data.type === 'CHESS_ANALYZER_BEST_MOVE') {
      makeMove(event.data.move);
    }
  });

  const checkBoard = setInterval(() => {
    const board = document.querySelector('.cg-board');
    if (board) {
      console.log('[Inject] Board found - ready to send data');
      clearInterval(checkBoard);
      interceptWebSocket();
      console.log('[Inject] Sensor started - using native game API');
    }
  }, 1000);

})();
