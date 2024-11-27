const WebSocket = require("ws");
const RoomController = require("./controllers/roomController");
const GameController = require("./controllers/gameController");

const initWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
        console.log("Client connected");

        ws.on("message", async (data) => {
            console.log("datattatta", data)
            try {
                const { event, payload } = JSON.parse(data);
                console.log("event", event, payload)
                if (event === "joinRoom") {
                    const { userId, gameId } = payload;
                    const response = await RoomController.joinRoomSocket(userId, gameId, wss, ws);
                    ws.roomId = response.roomId;
                    // ws.send(JSON.stringify({ event: "joinRoomResponse", payload: response }));
                } else if (event === "startToss") {
                    const { roomId, tossCardId } = payload;
                    await GameController.handleTossSocket(roomId, tossCardId, wss);
                }
            } catch (error) {
                console.error("Error handling message:", error.message);
                ws.send(JSON.stringify({ event: "error", payload: { message: error.message } }));
            }
        });

        ws.on("close", () => {
            console.log("Client disconnected");
        });
    });
};

module.exports = initWebSocketServer;
