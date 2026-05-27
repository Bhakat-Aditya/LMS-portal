import Course from '../models/models.course.js';
import Chapter from '../models/models.chapter.js';

const extractYouTubeId = (url) => {
    const regex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

    const match = url.match(regex);

    return match ? match[1] : null;
};

// CREATE COURSE
export const createCourse = async (req, res) => {
    try {
        const { title, description, price } = req.body;

        const newCourse = await Course.create({
            title,
            description,
            price,
            instructor: req.userId
        });

        res.status(201).json({
            message: 'Course created',
            course: newCourse
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating course',
            error: error.message
        });
    }
};

// ADD CHAPTER
export const addChapter = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, order, youtubeUrl } = req.body;

        const course = await Course.findOne({
            _id: courseId,
            instructor: req.userId
        });

        if (!course) {
            return res.status(404).json({
                message: 'Course not found or unauthorized'
            });
        }

        const youtubeVideoId = extractYouTubeId(youtubeUrl);

        if (!youtubeVideoId) {
            return res.status(400).json({
                message: 'Invalid YouTube URL provided'
            });
        }

        const newChapter = await Chapter.create({
            courseId,
            title,
            order,
            youtubeVideoId
        });

        res.status(201).json({
            message: 'Chapter added',
            chapter: newChapter
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error adding chapter',
            error: error.message
        });
    }
};

// ADD QUIZ
export const addQuizToChapter = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const { question, options, correctAnswerIndex } = req.body;

        const chapter = await Chapter.findById(chapterId).populate('courseId');

        if (!chapter) {
            return res.status(404).json({
                message: 'Chapter not found'
            });
        }

        if (chapter.courseId.instructor.toString() !== req.userId) {
            return res.status(403).json({
                message: 'Unauthorized: You do not own this course'
            });
        }

        chapter.quiz.push({
            question,
            options,
            correctAnswerIndex
        });

        await chapter.save();

        res.status(201).json({
            message: 'Quiz question added successfully',
            quiz: chapter.quiz
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error adding quiz',
            error: error.message
        });
    }
};

// GET ALL COURSES
export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({
            isPublished: true
        }).populate('instructor', 'name');

        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

// GET COURSE DETAILS
export const getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId).populate(
            'instructor',
            'name'
        );

        if (!course) {
            return res.status(404).json({
                message: 'Course not found'
            });
        }

        const chapters = await Chapter.find({
            courseId: courseId
        }).sort({ order: 1 });

        res.status(200).json({
            course,
            chapters
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching course details',
            error: error.message
        });
    }
};


// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTZlNzAzZTRkYzdlZmJjOWZkMzlmNCIsInJvbGUiOiJ0ZWFjaGVyIiwiaWF0IjoxNzc5ODg1ODQzLCJleHAiOjE3ODAxNDUwNDN9.CAVxbNa7R58tshs0RaI3X7KoMt_RFG6sctVStd-mHZs
// 6a16e7d132c49307a9f5c4ca
// 6a16e89c87c2f8342365c756