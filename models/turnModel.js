const db = require('../config/db.config');

const Turn = {
    create: async (roomId, playerId) => {
        const [result] = await db.query(
            "INSERT INTO turns (room_id, player_id, turn_status, turn_start) VALUES (?, ?, 'pending', NOW())",
            [roomId, playerId]
        );
        return result.insertId;
    },

    markAsMissed: async (turnId) => {
        await db.query(
            "UPDATE turns SET turn_status = 'missed', turn_end = NOW() WHERE id = ?",
            [turnId]
        );
    },

    markAsPlayed: async (turnId) => {
        await db.query(
            "UPDATE turns SET turn_status = 'played', turn_end = NOW() WHERE id = ?",
            [turnId]
        );
    },

    getTurn: async (turnId) => {
        const [rows] = await db.query("SELECT * FROM turns WHERE id = ?", [turnId]);
        return rows[0] || null;
    },

    getPendingTurn: async (roomId, playerId) => {
        const [rows] = await db.query(
            "SELECT * FROM turns WHERE room_id = ? AND player_id = ? AND turn_status = 'pending'",
            [roomId, playerId]
        );
        return rows[0] || null;
    }
};

module.exports = Turn;
