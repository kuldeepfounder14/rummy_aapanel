const jwt = require('jsonwebtoken');

const authenticateAndRefreshToken = (req, res, next) => {
    const excludedPaths = ['/api/users/login', '/api/users/register', '/api/users/changepassword'];
      if (excludedPaths.includes(req.path)) {
        return next();
    }
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>
    if (!token) {
        return res.status(401).json({ status: 401, message: "Token is required for authentication." });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', (err, user) => {
        if (err) {
            return res.status(403).json({ status: 403, message: "Invalid or expired token." });
        }

        // Issue a new token with updated expiry
        const newToken = jwt.sign(
            { id: user.id, mobile: user.mobile },
            process.env.JWT_SECRET || 'your-jwt-secret',
            { expiresIn: '2d' } // Reset expiry to 30 minutes
        );

        // Attach new token to response header
        res.setHeader('Authorization', `Bearer ${newToken}`);
        req.user = user; // Attach user data to request
        next();
    });
};

module.exports = authenticateAndRefreshToken
