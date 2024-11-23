const { findUserByMobile } = require('../models/userModel');
const userModels = require("../models/userModel")

exports.getAllUsers = async (req, res) => {
    try {
        const result = await userModels.getAllUsers()
        if (!result || result.length === 0) {
            res.status(404).json({ status: 404, message: "users not found" })
        }
        res.status(200).json({ status: 200, message: "fetched all users", allusers: result })
    } catch (err) {
        res.status(500).json({ status: 500, message: "Fetching users failed" })
    }
} 

exports.loginUser = async (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
        return res.status(400).json({ status:400,message: "Mobile number and password are required." });
    }
    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json({ status:400,message: "Mobile number must be 10 digits." });
    }
    if (password.length !== 6) {
        return res.status(400).json({ status:400,message: "Password must be 6 characters long." });
    }
    try {
        const user = await findUserByMobile(mobile);
        if (!user) {
            console.log("No user found for mobile:", mobile);
            return res.status(404).json({status:404, message: "User not found." });
        }
        if (user.password !== password) {
            console.log("Invalid password for user:", user.mobile);
            return res.status(401).json({status:401, message: "Invalid password." });
        }
        return res.status(200).json({
            status:200,
            message: "Login successful",
            user: {
                id: user.id,
                mobile: user.mobile,
            },
        });
    } catch (error) {
        console.log("Unexpected error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


