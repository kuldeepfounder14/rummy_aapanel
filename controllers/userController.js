
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByMobile, createUser, findUserByUsername } = require('../models/userModel');
const userModels = require("../models/userModel")

exports.getAllUsers = async (req, res) => {
    try {
        const result = await userModels.getAllUsers()
        if (!result || result.length === 0) {
            res.status(404).json({ success: false, message: "users not found" })
        }
        res.status(200).json({ success: true, message: "fetched all users", allusers: result })
    } catch (err) {
        res.status(500).json({ status: 500, message: "Fetching users failed" })
    }
} 

exports.registerUser = async (req, res) => {
    let { username, mobile, email, password } = req.body;
    username = username.trim();

    // Validate input
    if (!username || !mobile || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json({ success: false, message: "Mobile number must be 10 digits." });
    }
    if (password.length !== 6) {
        return res.status(400).json({ success: false, message: "Password must be exactly 6 characters long." });
    }

    try {
        // Check if the username already exists (after trimming spaces)
        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
            return res.status(409).json({ success: false, message: "Username already exists." });
        }
        
        // Check if the mobile number already exists
        const existingUser = await findUserByMobile(mobile);
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Mobile number already registered." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userEmail = email || null;

        // Save user to database
        const userId = await createUser(username, mobile, userEmail, hashedPassword);
        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            userId,
        });
    } catch (error) {
        console.error("Error in registration:", error.message);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};

// exports.loginUser = async (req, res) => {
//     const { mobile, password } = req.body;
//     if (!mobile || !password) {
//         return res.status(400).json({ status:400,message: "Mobile number and password are required." });
//     }
//     if (!/^\d{10}$/.test(mobile)) {
//         return res.status(400).json({ status:400,message: "Mobile number must be 10 digits." });
//     }
//     if (password.length !== 6) {
//         return res.status(400).json({ status:400,message: "Password must be 6 characters long." });
//     }
//     try {
//         const user = await findUserByMobile(mobile);
//         if (!user) {
//             console.log("No user found for mobile:", mobile);
//             return res.status(404).json({status:404, message: "User not found." });
//         }
//         if (user.password !== password) {
//             console.log("Invalid password for user:", user.mobile);
//             return res.status(401).json({status:401, message: "Invalid password." });
//         }
//         return res.status(200).json({
//             status:200,
//             message: "Login successful",
//             user: {
//                 id: user.id,
//                 mobile: user.mobile,
//             },
//         });
//     } catch (error) {
//         console.log("Unexpected error:", error.message);
//         return res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

exports.loginUser = async (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
        return res.status(400).json({ success: false, message: "Mobile number and password are required." });
    }
    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json({ success: false, message: "Mobile number must be 10 digits." });
    }
    if (password.length !== 6) {
        return res.status(400).json({ success: false,message: "Password must be 6 characters long." });
    }
    try {
        const user = await findUserByMobile(mobile);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
       // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid password." });
        }
        const token = jwt.sign(
            { id: user.id, mobile: user.mobile },
            process.env.JWT_SECRET || 'your-jwt-secret',
            { expiresIn: '2d' }
        );

        return res.status(200).json({
            success:true,
            message: "Login successful",
            id: user.id,
            token
        });
    } catch (error) {
        console.error("Unexpected error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Protected route example
exports.getProtectedData = (req, res) => {
    res.status(200).json({ status: 200, message: "Access granted", user: req.user });
};


exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ status: 500, message: "Failed to log out." });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: "Logged out successfully." });
    });
};

exports.changePassword = async (req, res) => {
    const { userId, password, newPassword, confirmNewPassword } = req.body;
    if (!userId || !password || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ success: false, message: "New passwords do not match." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    try {
        const user = await userModels.findUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Old password is incorrect." });
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await userModels.updatePassword(user.id, hashedNewPassword);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully.",
        });
    } catch (error) {
        console.error("Error in changePassword:", error.message);
        return res.status(500).json({ status: 500, message: "Server error." });
    }
};

exports.updateUser = async (req, res) => {
    const { userId, username } = req.body;

    // Validate input
    if (!userId || !username) {
        return res.status(400).json({ success: false, message: "User ID and username are required." });
    }

    try {
        const user = await userModels.findUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Ensure only `username` is updated
        const updatedData = { username };

        await userModels.updateUserProfile(userId, updatedData);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
        });
    } catch (error) {
        console.error("Error in updateUser:", error.message);
        return res.status(500).json({ status: 500, message: "Server error." });
    }
};

exports.getMe = async (req, res) => {
    const { userId } = req.body; 

    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required." });
    }

    try {
        const user = await userModels.findUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully.",
            data: {
                id: user.id,
                username: user.username,
                mobile: user.mobile,
                email: user.email || null,
                wallet_balance: user.wallet_balance,
            },
        });
    } catch (error) {
        console.error("Error in getProfile:", error.message);
        return res.status(500).json({ status: 500, message: "Server error." });
    }
};



