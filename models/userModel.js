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
        console.log("Executing query:", query, "with mobile:", mobile);
        const [results] = await db.execute(query, [mobile]);
        console.log("Query results:", results); // Log results for debugging
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.log("Database query error:", error.message);
        throw error; // Let the caller handle the error
    }
};


