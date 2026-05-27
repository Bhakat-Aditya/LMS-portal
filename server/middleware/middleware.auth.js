import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decodedData.id;
        req.userRole = decodedData.role;

        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
};

export const isTeacher = (req, res, next) => {
    if (req.userRole !== 'teacher') {
        return res.status(403).json({ message: 'Teacher access required' });
    }
    next();
};