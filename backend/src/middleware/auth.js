import jwt from 'jsonwebtoken';
const ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.JWT_SECRET;

function extractBearerToken(authorizationHeader) {
    if (!authorizationHeader || typeof authorizationHeader !== 'string') {
        return null;
    }

    const [scheme, token] = authorizationHeader.trim().split(/\s+/);
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
        return null;
    }

    return token;
}

function authenticateToken(req, res, next) {
    const token = extractBearerToken(req.get('authorization'));

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required in Authorization header as Bearer <token>'
        });
    }

    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const fullName = decoded.fullName || decoded.fullname || decoded.full_name || null;

        req.user = {
            id: decoded.id,
            email: decoded.email,
            fullName,
            fullname: fullName,
            role: decoded.role || 'tourist'
        };

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}

function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

export { authenticateToken, authorizeRoles };
