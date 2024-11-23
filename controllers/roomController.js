const Room = require("../models/roomModel");
const Player = require("../models/playerModel");
const GameController = require("../controllers/gameController");
const WebSocket = require("ws");

const RoomController = {
    joinRoomSocket: async (userId, gameId, wss, ws) => {
        const userDetails = await Room.getUserDetails(userId);
        const gameDetails = await Room.getGameDetails(gameId);

        if (!userDetails) throw new Error("Invalid userId");
        if (!gameDetails) throw new Error("Invalid gameId");

        const wallet_balance = parseFloat(userDetails.wallet_balance);
        const entry_fees = parseFloat(gameDetails.entry_fees);
        const { player_size, toss_decider_card } = gameDetails;

        if (wallet_balance < entry_fees) {
            throw new Error("Insufficient wallet balance to join this game");
        }

        let room = await Room.findWaitingRoom(gameId, player_size);
        if (!room) {
            const roomId = await Room.create(gameId);
            room = { id: roomId, status: "waiting" };

            const timer = setTimeout(async () => {
                const players = await Player.getPlayersInRoom(roomId);
                if (players.length < player_size) {
                    console.log(`Room ${roomId} not filled within 1 minute, destroying it.`);
                    await Room.updateStatus(roomId, "destroyed");
                    Room.clearRoomTimer(roomId);

                    // Notify all clients
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(
                                JSON.stringify({ event: "roomDestroyed", payload: { roomId } })
                            );
                        }
                    });
                }
            }, 60000);

            Room.updateRoomTimer(roomId, timer);
        }

        await Player.addToRoom(userId, room.id, gameId);
        const players = await Player.getPlayersInRoom(room.id);

        // Step 1: Send room update first, before toss and card distribution
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(
                    JSON.stringify({ event: "roomUpdate", payload: { roomId: room.id, players } })
                );
            }
        });

        if (players.length === player_size) {
            // Step 2: Proceed with toss and card distribution after room update
            await GameController.handleTossSocket(room.id, toss_decider_card, wss);
            await Room.updateStatus(room.id, "active");
            await Room.deductWalletBalance(room.id, entry_fees);
            await Room.setStartTime(room.id);
            Room.clearRoomTimer(room.id);
        }

        return { success: true, roomId: room.id, players };
    },
};

module.exports = RoomController;
