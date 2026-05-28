import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/routes.user.js';
import courseRoutes from './routes/routes.course.js';
import paymentRoutes from './routes/routes.payment.js';
import quizRoutes from './routes/routes.quiz.js';
import noticeRoutes from './routes/routes.notice.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/notices', noticeRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
  .catch((error) => console.log(error.message));