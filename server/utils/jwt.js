const jwt = require('jsonwebtoken');

/**
 * Generate a JWT for a user
 * @param {string} userId - User ID
 * @returns {string} JWT
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

module.exports = { generateToken };
