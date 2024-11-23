const app = require("./app");
require('dotenv').config();
const port = process.env.PORT || 3000;
const http = require('http');
const initWebSocketServer = require("./webSocketServer");

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.on('error', (error) => {
    console.error(`Server error: ${error.message}`);
});
