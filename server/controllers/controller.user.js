import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/models.user.js';
import QuizResult from '../models/models.quizresult.js';
import Chapter from '../models/models.chapter.js';
import Course from '../models/models.course.js';

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Role is intentionally NOT accepted from the request body.
        // Teacher accounts are pre-seeded; public registration creates students only.

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'student' // Always hardcoded — cannot be overridden
        });

        res.status(201).json({ message: 'User created successfully', userId: newUser._id });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT containing user ID and Role
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '3d' } // Token expires in 3 days
        );

        res.status(200).json({ result: user, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
};

// GET PROFILE — returns fresh user data including purchasedCourses
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
};

// GET ALL STUDENTS (Teacher only) — returns students list with course enrollment & quiz attempts
export const getAllStudents = async (req, res) => {
    try {
        // Fetch all students and populate their purchased courses
        const students = await User.find({ role: 'student' })
            .select('-password')
            .populate('purchasedCourses', 'title price')
            .sort({ createdAt: -1 });

        // Fetch all quiz results populated with chapter & course information
        const quizResults = await QuizResult.find()
            .populate({
                path: 'chapterId',
                select: 'title order courseId',
                populate: {
                    path: 'courseId',
                    select: 'title'
                }
            });

        // Group quiz results by studentId for fast lookup
        const resultsByStudent = {};
        quizResults.forEach(r => {
            if (!r.studentId) return;
            const sId = r.studentId.toString();
            if (!resultsByStudent[sId]) {
                resultsByStudent[sId] = [];
            }
            resultsByStudent[sId].push({
                _id: r._id,
                chapterId: r.chapterId?._id,
                chapterTitle: r.chapterId?.title || 'Unknown Chapter',
                chapterOrder: r.chapterId?.order || 0,
                courseId: r.chapterId?.courseId?._id,
                courseTitle: r.chapterId?.courseId?.title || 'Unknown Course',
                score: r.score,
                totalQuestions: r.totalQuestions,
                percentage: r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0
            });
        });

        // Merge student data with their quiz results
        const studentsWithResults = students.map(student => ({
            ...student.toObject(),
            quizResults: resultsByStudent[student._id.toString()] || []
        }));

        res.status(200).json(studentsWithResults);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching students directory',
            error: error.message
        });
    }
};