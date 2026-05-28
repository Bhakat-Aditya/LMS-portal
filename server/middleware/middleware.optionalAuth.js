import jwt from 'jsonwebtoken';

// Like verifyToken but does NOT reject the request if no token is present.
// Populates req.userId and req.userRole if a valid token exists.
// Used on public routes that want to behave differently for authenticated teachers.
export const optionalVerifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id;
            req.userRole = decoded.role;
        }
    } catch {
        // Invalid or expired token — continue without auth data
    }
    next();
};
