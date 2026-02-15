import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.user = {
                id: decoded.sub,
                role: decoded.role
            };

            next();

        } catch (error) {
            console.error(error);
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Not authorized, token failed',
                errors: [],
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Not authorized, no token',
            errors: [],
        });
    }
};


export const hasRole = (...roles) => {
    console.log('hasRole', roles);
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                statusCode: 403,
                message: `Forbidden: Requires one of the following roles: ${roles.join(', ')}`,
                errors: [],
            });
        }
        next();
    };
};