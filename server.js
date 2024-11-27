const http = require('http');
const app = require("./app");
const initWebSocketServer = require("./webSocketServer");
require('dotenv').config();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(port, () => {
    console.log(`Server running on ${port}`);
});

app.on('error', (error) => {
    console.error(`Server error: ${error.message}`);
});
