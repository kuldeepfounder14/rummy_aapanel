const db = require('../config/db.config');
const roomTimers = new Map();

const Room = {
    getUserDetails: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM users WHERE id = ?`, [userId]);
        return rows[0] || null;
    },
    getGameDetails: async (gameId) => {
        const [rows] = await db.query(`SELECT * FROM game_type WHERE id = ?`, [gameId]);
        return rows[0] || null;
    },
    findWaitingRoom: async (gameId, playerSize) => {
        const [rooms] = await db.query(
            `SELECT r.id, COUNT(p.id) as player_count 
             FROM rooms r 
             LEFT JOIN players p ON r.id = p.room_id 
             WHERE r.status = 'waiting' AND r.game_id = ? 
             GROUP BY r.id 
             HAVING player_count < ? 
             LIMIT 1`,
            [gameId, playerSize]
        );
        return rooms[0] || null;
    },
    create: async (gameId) => {
        const [result] = await db.query(`INSERT INTO rooms (game_id, status) VALUES (?, 'waiting')`, [gameId]);
        return result.insertId;
    },
    updateTossWinner: async (roomId, tossWinner) => {
        // console.log("updateTossWinner room model",roomId, tossWinner.user_id)
      const res=  await db.query(`UPDATE rooms SET toss_winner = ? WHERE id = ?`, [tossWinner.user_id, roomId]);
      console.log("updateTossWinner",res)
    },    
    updateStatus: async (roomId, status) => {
        await db.query(`UPDATE rooms SET status = ? WHERE id = ?`, [status, roomId]);
    },
    setStartTime: async (roomId) => {
        await db.query(`UPDATE rooms SET start_time = NOW() WHERE id = ?`, [roomId]);
    },
    deductWalletBalance: async (roomId, entry_fees) => {
        try {
            const [players] = await db.query(
                `SELECT user_id FROM players WHERE room_id = ?`,
                [roomId]
            );
            if (players.length === 0) {
                throw new Error('No users found in the specified room');
            }
            for (const player of players) {
                const { user_id } = player;
                await db.query(
                    `UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ? AND wallet_balance >= ?`,
                    [entry_fees, user_id, entry_fees]
                );
                const [updatedUser] = await db.query(
                    `SELECT wallet_balance FROM users WHERE id = ?`,
                    [user_id]
                );
                if (updatedUser.wallet_balance < 0) {
                    console.warn(`User ${user_id} has insufficient balance!`);
                }
            }
        } catch (error) {
            console.error('Error deducting wallet balance:', error.message);
            throw error;
        }
    },
    updateRoomTimer: (roomId, timer) => {
        roomTimers.set(roomId, timer);
    },

    getRoomTimer: (roomId) => {
        return roomTimers.get(roomId);
    },

    clearRoomTimer: (roomId) => {
        const timer = roomTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            roomTimers.delete(roomId);
        }
    },
    getRoomNamespace: (roomId) => `room_${roomId}`,
};

module.exports = Room;
