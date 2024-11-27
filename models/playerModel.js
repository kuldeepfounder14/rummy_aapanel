const db = require('../config/db.config');

const Player = {
    addToRoom: async (userId, roomId, gameId) => {
        await db.query("INSERT INTO players (user_id, room_id, game_id) VALUES (?, ?, ?)", [userId, roomId, gameId]);
    },
    getPlayersInRoom: async (roomId) => {
        const [rows] = await db.query("SELECT * FROM players WHERE room_id = ?", [roomId]);
        // console.log("rowrowrow",rows)
        return rows;
    },
    updateTurn: async (roomId, playerId, isTurn) => {
        await db.query("UPDATE players SET is_turn = ? WHERE room_id = ? AND user_id = ?", [isTurn, roomId, playerId.user_id]);
    },
    getPlayerTurnStatus: async (roomId, playerId) => {
        console.log("roomId, playerId",roomId, playerId)
        const [rows] = await db.query(
            "SELECT is_turn FROM players WHERE room_id = ? AND user_id = ?",
            [roomId, playerId]
        );
        console.log("rows, rows",rows)
        return rows.length > 0 ? rows[0].is_turn : false;
    }
    
};

module.exports = Player