function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }
}

module.exports = { requireAuth };
