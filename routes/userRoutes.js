const express = require("express")
const router = express.Router()
const {registerUser, getAllUsers, loginUser, getProtectedData, logoutUser, changePassword, getMe, updateUser } = require("../controllers/userController")
const { authenticateAndRefreshToken } = require('../middleware/authMiddleware');  

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/protected', getProtectedData); 
router.get("/getallusers", getAllUsers)
router.post('/change_password', changePassword);
router.get('/get_profile', getMe);
router.post('/update_profile', updateUser);

module.exports = router


