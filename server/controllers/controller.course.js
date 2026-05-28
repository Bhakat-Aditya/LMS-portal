import Course from '../models/models.course.js';
import Chapter from '../models/models.chapter.js';
import User from '../models/models.user.js';

const extractYouTubeId = (url) => {
    const regex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

    const match = url.match(regex);

    return match ? match[1] : null;
};

// CREATE COURSE
export const createCourse = async (req, res) => {
    try {
        const { title, description, price, thumbnailUrl } = req.body;

        const newCourse = await Course.create({
            title,
            description,
            price,
            thumbnailUrl: thumbnailUrl || '',
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

// ADD CHAPTER — order is auto-detected
export const addChapter = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, youtubeUrl, videoUrl } = req.body;

        const course = await Course.findOne({
            _id: courseId,
            instructor: req.userId
        });

        if (!course) {
            return res.status(404).json({
                message: 'Course not found or unauthorized'
            });
        }

        if (!youtubeUrl && !videoUrl) {
            return res.status(400).json({
                message: 'Please provide either a YouTube URL or a direct Video URL'
            });
        }

        let youtubeVideoId = null;
        if (youtubeUrl) {
            youtubeVideoId = extractYouTubeId(youtubeUrl);
            if (!youtubeVideoId) {
                return res.status(400).json({
                    message: 'Invalid YouTube URL provided'
                });
            }
        }

        // Auto-detect next order number
        const lastChapter = await Chapter.findOne({ courseId }).sort({ order: -1 });
        const order = lastChapter ? lastChapter.order + 1 : 1;

        const newChapter = await Chapter.create({
            courseId,
            title,
            order,
            youtubeVideoId,
            videoUrl: videoUrl || ''
        });

        res.status(201).json({
            message: `Chapter added as #${order}`,
            chapter: newChapter
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error adding chapter',
            error: error.message
        });
    }
};

// TOGGLE CHAPTER VISIBILITY (teacher only)
export const toggleChapterVisibility = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const chapter = await Chapter.findById(chapterId).populate('courseId');

        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        if (chapter.courseId.instructor.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        chapter.isVisible = !chapter.isVisible;
        await chapter.save();

        res.status(200).json({
            message: chapter.isVisible ? 'Chapter is now visible to students' : 'Chapter hidden from students',
            isVisible: chapter.isVisible
        });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling visibility', error: error.message });
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

// GET ALL COURSES (published only — public catalog)
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

// GET TEACHER'S OWN COURSES with chapter count + enrollment count
export const getTeacherCourses = async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.userId });

        const coursesWithStats = await Promise.all(
            courses.map(async (course) => {
                const chapterCount = await Chapter.countDocuments({ courseId: course._id });
                // Count students who have purchased this course
                const enrollmentCount = await User.countDocuments({
                    purchasedCourses: course._id
                });
                return { ...course.toObject(), chapterCount, enrollmentCount };
            })
        );

        res.status(200).json(coursesWithStats);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching teacher courses',
            error: error.message
        });
    }
};

// PUBLISH / UNPUBLISH COURSE toggle
export const togglePublishCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findOne({ _id: courseId, instructor: req.userId });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        course.isPublished = !course.isPublished;
        await course.save();

        res.status(200).json({
            message: course.isPublished ? 'Course published' : 'Course unpublished',
            isPublished: course.isPublished
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error toggling publish status',
            error: error.message
        });
    }
};

// GET COURSE DETAILS — teachers see all chapters; students see only visible
export const getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId).populate('instructor', 'name');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Teachers see hidden chapters too; everyone else only sees visible ones
        const isTeacher = req.userRole === 'teacher';
        const chapterFilter = isTeacher
            ? { courseId }
            : { courseId, isVisible: { $ne: false } };

        const chapters = await Chapter.find(chapterFilter).sort({ order: 1 });

        res.status(200).json({ course, chapters });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching course details',
            error: error.message
        });
    }
};

// GET ENROLLED STUDENTS for a course (teacher only)
export const getEnrolledStudents = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Verify the requesting teacher owns this course
        const course = await Course.findOne({ _id: courseId, instructor: req.userId });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const students = await User.find(
            { purchasedCourses: courseId },
            'name email createdAt'
        ).sort({ createdAt: -1 });

        res.status(200).json({ students, total: students.length });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};

// GET CHAPTERS BY COURSE (used by teacher quiz form)
export const getChaptersByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Only the owning teacher can fetch this
        const course = await Course.findOne({ _id: courseId, instructor: req.userId });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const chapters = await Chapter.find({ courseId }).sort({ order: 1 }).select('title order');
        res.status(200).json(chapters);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chapters', error: error.message });
    }
};