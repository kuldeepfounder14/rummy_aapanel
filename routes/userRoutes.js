const express = require("express")
const router = express.Router()
const { getAllUsers,loginUser } = require("../controllers/userController")

router.post('/login', loginUser);
router.get("/getallusers", getAllUsers)
module.exports = router