const isProduction = process.env.NODE_ENV === 'production';

const CLIENT_URL = process.env.CLIENT_URL || (
    isProduction
        ? 'https://campus-olx-three.vercel.app'
        : 'http://localhost:5173'
);

const BASE_URL = process.env.BASE_URL || (
    isProduction
        ? 'https://campus-olx-13aq.onrender.com'
        : `http://localhost:${process.env.PORT || 5001}`
);

module.exports = {
    BASE_URL,
    CLIENT_URL
};
