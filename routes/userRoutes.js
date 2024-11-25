const express = require("express")
const router = express.Router()
const {registerUser, getAllUsers, loginUser, getProtectedData, logoutUser, changePassword, getMe, updateUser } = require("../controllers/userController")
const { authenticateAndRefreshToken } = require('../middleware/authMiddleware');  

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/protected', getProtectedData); 
router.get("/getallusers", getAllUsers)
router.post('/changepassword', changePassword);
router.get('/getme', getMe);
router.post('/updateuser', updateUser);

module.exports = router


