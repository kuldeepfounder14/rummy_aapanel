
const WebSocket = require('ws');
let wss;

function initializeWebSocket(port) {
  wss = new WebSocket.Server({ port});

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", async (message) => {
        const stringMessage = message.toString()
        console.log("message",stringMessage)

      try {
        const parsedMessage = JSON.parse(stringMessage);
        console.log("messagasdfgdsfghfdsfg",parsedMessage)
      } catch (error) {
        console.error('WebSocket Error message:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));   
      }
    ws.send('sukriya');
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error); 
    });
  });
}

function getWebSocketServer() {
  return wss;
}

module.exports = {
  initializeWebSocket,
  getWebSocketServer,
};
