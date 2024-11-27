const Room = require("../models/roomModel");
const Player = require("../models/playerModel");
const GameController = require("../controllers/gameController");
const WebSocket = require("ws");

const broadcastToRoom = (wss, roomId, message) => {
    // console.log("broadcastToRoombroadcastToRoom",wss.clients,roomId,message)
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify(message));
        }
    });
};
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
        // console.log("rooomrroom room ",room)
        if (!room) {
            const roomId = await Room.create(gameId);
            room = { id: roomId,username:userDetails.username, status: "waiting" };

            const timer = setTimeout(async () => {
                const players = await Player.getPlayersInRoom(roomId);
                if (players.length < player_size) {
                    console.log(`Room ${roomId} not filled within 1 minute, destroying it.`);
                    await Room.updateStatus(roomId, "destroyed");
                    Room.clearRoomTimer(roomId);

                    // Notify all clients
                    broadcastToRoom(wss, roomId, {
                        event: "roomUpdate",
                        payload: { roomId,roomStatus:0 },
                    });
                }
            }, 60000);

            Room.updateRoomTimer(roomId, timer);
        }

        await Player.addToRoom(userId, room.id, gameId);
        const players = await Player.getPlayersInRoom(room.id);
console.log("Playerplayer",players)
          const enrichedPlayers = await Promise.all(
        players.map(async (player) => {
            const user = await Room.getUserDetails(player.user_id);
            return {
                ...player,
                username: user ? user.username : null, 
            };
        })
    );
        // Step 1: Send room update first, before toss and card distribution
          ws.roomId = room.id;
         broadcastToRoom(wss, room.id, {
            event: "roomUpdate",
            payload: { roomId: room.id,roomStatus:1, players:enrichedPlayers},
        });
        if (players.length === player_size) {
            let countdown = 5;
            const interval = setInterval(async () => {
                if (countdown > 0) {
                    broadcastToRoom(wss, room.id, {
                        event: "timerUpdate",
                        payload: { taskId:1,countdown },
                    });
                    countdown -= 1;
                } else {
                    clearInterval(interval);
                    try {
                        // Execute the toss after countdown
                        await GameController.handleTossSocket(room.id, toss_decider_card, wss);

                        // Update room status and handle wallet balance
                        await Room.updateStatus(room.id, "active");
                        await Room.deductWalletBalance(room.id, entry_fees);
                        await Room.setStartTime(room.id);

                        // Clear room timer
                        Room.clearRoomTimer(room.id);
                    } catch (error) {
                        console.error("Error during toss handling:", error);
                    }
                }
            }, 1000);
        }
        return { success: true, roomId: room.id, players };
    },
};

module.exports = RoomController;
