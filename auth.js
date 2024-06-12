
const jwt = require('jsonwebtoken');

const secretKey = "AIzaSyC7P-q_O1ccqBuZFVMbISkailqey6YTuSA";  // Replace with your actual secret key

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };
