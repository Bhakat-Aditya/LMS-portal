// src/pages/TeacherDashboard.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext";

// ── Helpers ──────────────────────────────────────────
const Field = ({ label, id, type = "text", value, onChange, placeholder, required, min }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === "textarea" ? (
      <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={3}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-905 dark:text-gray-105 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors" />
    ) : (
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} min={min}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-955 text-gray-905 dark:text-gray-105 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
    )}
  </div>
);

const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const c = type === "success" 
    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/35 text-green-800 dark:text-green-400" 
    : "bg-red-50 dark:bg-red-955/20 border-red-200 dark:border-red-900/35 text-red-800 dark:text-red-400";
  return <div className={`border rounded-md px-4 py-2 text-sm ${c} transition-colors`}>{msg}</div>;
};

const Card = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 transition-all duration-300">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5 pb-3 border-b dark:border-gray-800 transition-colors">{title}</h2>
    {children}
  </div>
);

// ── Enrolled Students Modal ───────────────────────────
const StudentsModal = ({ course, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${course._id}/students`)
      .then(res => setStudents(res.data.students))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [course._id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transition-colors duration-300">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-850">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg transition-colors">{course.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{students.length} enrolled student{students.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-light select-none cursor-pointer">×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No students enrolled yet.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((s, i) => (
                <li key={s._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/60 border border-gray-100 dark:border-gray-850 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner select-none">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-150 truncate transition-colors">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.email}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">#{i + 1}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════
const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== "teacher") navigate("/");
  }, [user, navigate]);

  const [myCourses, setMyCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // ── Create course form ────────────────────────────
  const [courseForm, setCourseForm] = useState({ title: "", description: "", price: "", thumbnailUrl: "" });
  const [courseMsg, setCourseMsg] = useState({ text: "", type: "" });
  const [courseSubmitting, setCourseSubmitting] = useState(false);

  // ── Add chapter form ──────────────────────────────
  const [chapterForm, setChapterForm] = useState({ selectedCourseId: "", title: "", youtubeUrl: "" });
  const [chapterMsg, setChapterMsg] = useState({ text: "", type: "" });
  const [chapterSubmitting, setChapterSubmitting] = useState(false);

  // ── Add quiz form ─────────────────────────────────
  const [quizForm, setQuizForm] = useState({
    selectedCourseId: "",
    selectedChapterId: "",
    question: "",
    optionA: "", optionB: "", optionC: "", optionD: "",
    correctAnswerIndex: "0",
  });
  const [quizChapters, setQuizChapters] = useState([]); // chapters for selected course in quiz form
  const [quizMsg, setQuizMsg] = useState({ text: "", type: "" });
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // ── Students modal ────────────────────────────────
  const [viewingStudentsCourse, setViewingStudentsCourse] = useState(null);

  // ── Publish toggling ──────────────────────────────
  const [publishingId, setPublishingId] = useState(null);

  // ── Fetch courses ─────────────────────────────────
  const fetchMyCourses = async () => {
    try {
      const res = await api.get("/courses/teacher/my-courses");
      setMyCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses:", err.message);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => { if (user?.role === "teacher") fetchMyCourses(); }, [user]);

  // Fetch chapters when quiz course selection changes
  useEffect(() => {
    if (!quizForm.selectedCourseId) { setQuizChapters([]); return; }
    api.get(`/courses/${quizForm.selectedCourseId}/chapters-list`)
      .then(res => setQuizChapters(res.data))
      .catch(() => setQuizChapters([]));
    setQuizForm(prev => ({ ...prev, selectedChapterId: "" }));
  }, [quizForm.selectedCourseId]);

  // ── Analytics ─────────────────────────────────────
  const totalStudents = myCourses.reduce((s, c) => s + (c.enrollmentCount ?? 0), 0);
  const totalRevenue = myCourses.reduce((s, c) => s + (c.price ?? 0) * (c.enrollmentCount ?? 0), 0);
  const publishedCount = myCourses.filter(c => c.isPublished).length;

  // ── Handlers ─────────────────────────────────────
  const handleCourseChange = e => setCourseForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCourseSubmitting(true);
    setCourseMsg({ text: "", type: "" });
    try {
      await api.post("/courses", courseForm);
      setCourseMsg({ text: "✅ Course created! Publish it to make it visible to students.", type: "success" });
      setCourseForm({ title: "", description: "", price: "", thumbnailUrl: "" });
      fetchMyCourses();
    } catch (err) {
      setCourseMsg({ text: err.response?.data?.message || "Failed to create course.", type: "error" });
    } finally {
      setCourseSubmitting(false);
    }
  };

  const handleChapterChange = e => setChapterForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleAddChapter = async (e) => {
    e.preventDefault();
    setChapterSubmitting(true);
    setChapterMsg({ text: "", type: "" });
    const { selectedCourseId, title, youtubeUrl } = chapterForm;
    if (!selectedCourseId) {
      setChapterMsg({ text: "Please select a course first.", type: "error" });
      setChapterSubmitting(false);
      return;
    }

    // Auto-detect if it is a YouTube URL or direct video URL
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(youtubeUrl);
    const payload = { title };
    if (isYouTube) {
      payload.youtubeUrl = youtubeUrl;
    } else {
      payload.videoUrl = youtubeUrl;
    }

    try {
      await api.post(`/courses/${selectedCourseId}/chapters`, payload);
      setChapterMsg({ text: "✅ Chapter added!", type: "success" });
      setChapterForm(p => ({ ...p, title: "", youtubeUrl: "" }));
      fetchMyCourses();
    } catch (err) {
      setChapterMsg({ text: err.response?.data?.message || "Failed to add chapter.", type: "error" });
    } finally {
      setChapterSubmitting(false);
    }
  };

  const handleQuizChange = e => setQuizForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    setQuizSubmitting(true);
    setQuizMsg({ text: "", type: "" });
    const { selectedChapterId, question, optionA, optionB, optionC, optionD, correctAnswerIndex } = quizForm;
    if (!selectedChapterId) {
      setQuizMsg({ text: "Please select a chapter.", type: "error" });
      setQuizSubmitting(false);
      return;
    }
    try {
      await api.post(`/courses/chapters/${selectedChapterId}/quiz`, {
        question,
        options: [optionA, optionB, optionC, optionD],
        correctAnswerIndex: Number(correctAnswerIndex)
      });
      setQuizMsg({ text: "✅ Quiz question added!", type: "success" });
      setQuizForm(p => ({ ...p, question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswerIndex: "0" }));
    } catch (err) {
      setQuizMsg({ text: err.response?.data?.message || "Failed to add question.", type: "error" });
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleTogglePublish = async (courseId) => {
    setPublishingId(courseId);
    try {
      const res = await api.patch(`/courses/${courseId}/publish`);
      setMyCourses(prev => prev.map(c => c._id === courseId ? { ...c, isPublished: res.data.isPublished } : c));
    } catch {
      alert("Could not toggle publish status.");
    } finally {
      setPublishingId(null);
    }
  };

  if (!user) return <div className="p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 transition-colors">Teacher Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Welcome back, <strong>{user.name}</strong>.</p>
        </div>
        <Link
          to="/teacher/students"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm select-none"
        >
          👥 View All Students
        </Link>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Courses", value: myCourses.length, colour: "text-blue-600 dark:text-blue-400" },
          { label: "Published", value: publishedCount, colour: "text-green-600 dark:text-green-400" },
          { label: "Total Students", value: totalStudents, colour: "text-indigo-600 dark:text-indigo-400" },
          { label: "Est. Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, colour: "text-orange-600 dark:text-orange-400" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center shadow-sm min-w-0 transition-all duration-300">
            <p className={`text-2xl sm:text-3xl font-black ${s.colour} truncate`} title={s.value}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-450 mt-1 font-semibold truncate" title={s.label}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Students Modal */}
      {viewingStudentsCourse && (
        <StudentsModal course={viewingStudentsCourse} onClose={() => setViewingStudentsCourse(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ═══════ LEFT COLUMN ═══════ */}
        <div className="space-y-8">

          {/* Create Course */}
          <Card title="Create New Course">
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <Field label="Course Title" id="title" value={courseForm.title} onChange={handleCourseChange} placeholder="e.g. Complete React Developer" required />
              <Field label="Description" id="description" type="textarea" value={courseForm.description} onChange={handleCourseChange} placeholder="What will students learn?" required />
              <Field label="Price (₹)" id="price" type="number" min="0" value={courseForm.price} onChange={handleCourseChange} placeholder="e.g. 999" required />
              <Field label="Thumbnail URL" id="thumbnailUrl" value={courseForm.thumbnailUrl} onChange={handleCourseChange} placeholder="https://... (optional)" />
              {courseForm.thumbnailUrl && (
                <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 aspect-video max-h-[160px] bg-gray-50 dark:bg-gray-950">
                  <img src={courseForm.thumbnailUrl} alt="preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
                </div>
              )}
              <Toast msg={courseMsg.text} type={courseMsg.type} />
              <button id="create-course-btn" type="submit" disabled={courseSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-all cursor-pointer disabled:bg-gray-300 dark:disabled:bg-gray-800 dark:disabled:text-gray-600">
                {courseSubmitting ? "Creating..." : "Create Course"}
              </button>
            </form>
          </Card>

          {/* Add Chapter */}
          <Card title="Add Chapter">
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div>
                <label htmlFor="selectedCourseId" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">Select Course <span className="text-red-500">*</span></label>
                <select id="selectedCourseId" value={chapterForm.selectedCourseId} onChange={handleChapterChange} required
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
                  <option value="">-- Choose a course --</option>
                  {myCourses.map(c => <option key={c._id} value={c._id}>{c.title}{!c.isPublished ? " (Draft)" : ""}</option>)}
                </select>
              </div>
              <Field label="Chapter Title" id="title" value={chapterForm.title} onChange={handleChapterChange} placeholder="e.g. Introduction to Hooks" required />
              <Field label="Video URL" id="youtubeUrl" value={chapterForm.youtubeUrl} onChange={handleChapterChange} placeholder="Paste direct .mp4 link OR YouTube watch link" required />
              <Toast msg={chapterMsg.text} type={chapterMsg.type} />
              <button id="add-chapter-btn" type="submit" disabled={chapterSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition-all cursor-pointer disabled:bg-gray-300 dark:disabled:bg-gray-800 dark:disabled:text-gray-600">
                {chapterSubmitting ? "Adding..." : "Add Chapter"}
              </button>
            </form>
          </Card>

          {/* Add Quiz Question */}
          <Card title="Add Quiz Question">
            <form onSubmit={handleAddQuiz} className="space-y-4">
              {/* Course select */}
              <div>
                <label htmlFor="selectedCourseId" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">Course <span className="text-red-500">*</span></label>
                <select id="selectedCourseId" value={quizForm.selectedCourseId}
                  onChange={e => setQuizForm(p => ({ ...p, selectedCourseId: e.target.value }))}
                  required className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-955 text-gray-900 dark:text-gray-100 transition-colors">
                  <option value="">-- Choose a course --</option>
                  {myCourses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>

              {/* Chapter select */}
              <div>
                <label htmlFor="selectedChapterId" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">Chapter <span className="text-red-500">*</span></label>
                <select id="selectedChapterId" value={quizForm.selectedChapterId}
                  onChange={e => setQuizForm(p => ({ ...p, selectedChapterId: e.target.value }))}
                  required disabled={!quizForm.selectedCourseId}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-955 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-950 disabled:text-gray-400 dark:disabled:text-gray-500 transition-colors">
                  <option value="">{quizForm.selectedCourseId ? "-- Choose a chapter --" : "Select a course first"}</option>
                  {quizChapters.map(ch => <option key={ch._id} value={ch._id}>{ch.order}. {ch.title}</option>)}
                </select>
              </div>

              <Field label="Question" id="question" type="textarea" value={quizForm.question} onChange={handleQuizChange} placeholder="e.g. What does useState return?" required />

              {/* 4 options */}
              <div className="grid grid-cols-2 gap-3">
                {["A", "B", "C", "D"].map((letter) => (
                  <div key={letter}>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Option {letter}</label>
                    <input
                      id={`option${letter}`}
                      type="text"
                      value={quizForm[`option${letter}`]}
                      onChange={handleQuizChange}
                      placeholder={`Option ${letter}`}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Correct answer */}
              <div>
                <label htmlFor="correctAnswerIndex" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">Correct Answer <span className="text-red-500">*</span></label>
                <select id="correctAnswerIndex" value={quizForm.correctAnswerIndex} onChange={handleQuizChange}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-955 text-gray-900 dark:text-gray-100 transition-colors">
                  <option value="0">Option A</option>
                  <option value="1">Option B</option>
                  <option value="2">Option C</option>
                  <option value="3">Option D</option>
                </select>
              </div>

              <Toast msg={quizMsg.text} type={quizMsg.type} />
              <button id="add-quiz-btn" type="submit" disabled={quizSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all cursor-pointer disabled:bg-gray-300 dark:disabled:bg-gray-800 dark:disabled:text-gray-600">
                {quizSubmitting ? "Adding..." : "Add Question"}
              </button>
            </form>
          </Card>
        </div>

        {/* ═══════ RIGHT COLUMN ═══════ */}
        <div>
          <Card title={`My Courses (${myCourses.length})`}>
            {coursesLoading ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">Loading your courses...</p>
            ) : myCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-gray-500 text-sm">No courses yet. Create one on the left!</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {myCourses.map(course => (
                  <li key={course._id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-950/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-950 flex-shrink-0 border border-gray-100 dark:border-gray-800">
                        {course.thumbnailUrl
                          ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
                          : <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate transition-colors">{course.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">₹{course.price}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[
                            { icon: "📚", val: `${course.chapterCount ?? 0} ch`, colour: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-transparent dark:border-blue-900/30" },
                            { icon: "👥", val: `${course.enrollmentCount ?? 0} students`, colour: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-transparent dark:border-indigo-900/30" },
                            { icon: "💰", val: `₹${((course.price ?? 0) * (course.enrollmentCount ?? 0)).toLocaleString("en-IN")}`, colour: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-transparent dark:border-orange-900/30" },
                          ].map(s => (
                            <span key={s.val} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.colour} transition-colors`}>
                              {s.icon} {s.val}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-50 dark:border-gray-850 pt-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                        course.isPublished 
                          ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-transparent dark:border-green-900/20" 
                          : "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border border-transparent dark:border-yellow-900/20"
                      }`}>
                        {course.isPublished ? "● Published" : "● Draft"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingStudentsCourse(course)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 border border-transparent dark:border-indigo-900/30 transition-colors cursor-pointer select-none"
                        >
                          👥 Students
                        </button>
                        <button
                          onClick={() => handleTogglePublish(course._id)}
                          disabled={publishingId === course._id}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer select-none disabled:opacity-50 ${
                            course.isPublished
                              ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60"
                              : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-450 hover:bg-green-100 dark:hover:bg-green-950/60"
                          }`}
                        >
                          {publishingId === course._id ? "..." : course.isPublished ? "Unpublish" : "Publish →"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
