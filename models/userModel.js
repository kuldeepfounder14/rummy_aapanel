const db = require("../config/db.config")
exports.getAllUsers = async () => {
    try {
        const sql = `select * from users`
        const [result] = await db.query(sql)
        return result
    } catch (err) {
        console.log(err)
        throw err
    }
}

exports.findUserByMobile = async (mobile) => {
    const query = 'SELECT * FROM users WHERE mobile = ?';
    try {
        const [results] = await db.execute(query, [mobile]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.log("Database query error:", error.message);
        throw error; 
    }
};

exports.findUserByUsername = async (username) => {
    const query = 'SELECT id FROM users WHERE username = ?';
    try {
        const [results] = await db.execute(query, [username]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error("Error finding username:", error.message);
        throw error;
    }
};

exports.createUser = async (username, mobile, email, hashedPassword) => {
    const query = 'INSERT INTO users (username, mobile, email, password) VALUES (?, ?, ?, ?)';
    try {
        const [results] = await db.execute(query, [username, mobile, email, hashedPassword]);
        return results.insertId;
    } catch (error) {
        console.error("Error inserting user:", error.message);
        throw error;
    }
};

exports.updatePassword = async (userId, hashedPassword) => {
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    try {
        await db.execute(query, [hashedPassword, userId]);
    } catch (error) {
        console.error("Error updating password:", error.message);
        throw error;
    }
};

// get me (profile)
exports.findUserById = async (userId) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    try {
        const [results] = await db.execute(query, [userId]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error("Error finding user by ID:", error.message);
        throw error;
    }
};

// Update user profile (excluding sensitive fields)
exports.updateUserProfile = async (userId, updatedData) => {
    const fields = [];
    const values = [];

    // Dynamically build the query fields
    for (const [key, value] of Object.entries(updatedData)) {
        fields.push(`${key} = ?`);
        values.push(value);
    }
    values.push(userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    try {
        await db.execute(query, values);
    } catch (error) {
        console.error("Error updating user profile:", error.message);
        throw error;
    }
};


