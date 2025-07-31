import { JsonWebTokenError } from 'jsonwebtoken';

const auth = (roles = []) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized', status: 'error' });

        try {
            const decoded = JsonWebTokenError.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: 'Acess denied', status: 'error' });
            }
            next();
        }   catch (err) {
            res.status(401).json({ message: 'Invalid token', status: 'error' });
        }
    };
};

module.exports = auth;