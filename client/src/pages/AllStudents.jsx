// src/pages/AllStudents.jsx
import { useState, useEffect, useContext, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const AllStudents = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if not teacher
  useEffect(() => {
    if (user && user.role !== "teacher") {
      navigate("/");
    }
  }, [user, navigate]);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const fetchStudents = async () => {
    try {
      const response = await api.get("/users/all-students");
      setStudents(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch students list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "teacher") {
      fetchStudents();
    }
  }, [user]);

  const toggleExpand = (studentId) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  if (!user || user.role !== "teacher") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-655 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
            🔑
          </div>
          <h2 className="font-extrabold text-gray-900 dark:text-gray-100 text-lg transition-colors">
            Authorizing Directory...
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">
            Please wait while we verify your academic access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header and navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
            <Link
              to="/teacher/dashboard"
              className="hover:text-blue-600 transition-colors"
            >
              Teacher Dashboard
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 dark:text-gray-100 font-bold transition-colors">
              Students Directory
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight transition-colors">
            All Registered Students
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium transition-colors">
            Monitor student course enrollments and inspect detailed chapter quiz
            scores.
          </p>
        </div>
        <Link
          to="/teacher/dashboard"
          className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-all active:scale-95 cursor-pointer select-none"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4 transition-all duration-300">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
            Loading students directory...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 text-center text-red-800 dark:text-red-400 font-medium">
          ⚠️ {error}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 text-center shadow-sm transition-all duration-300">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-500 dark:text-gray-300 text-sm font-bold">
            No students registered yet
          </p>
          <p className="text-gray-400 dark:text-gray-555 text-xs mt-1">
            Students will appear here as soon as they sign up on the portal.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE & TABLET CARD VIEW (Visible under 768px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {students.map((student) => {
              const isExpanded = expandedStudentId === student._id;
              const quizCount = student.quizResults?.length || 0;
              const coursesCount = student.purchasedCourses?.length || 0;
              const registrationDate = new Date(
                student.createdAt,
              ).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={student._id}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl shadow-sm transition-all overflow-hidden ${
                    isExpanded
                      ? "border-blue-300 dark:border-blue-800 ring-2 ring-blue-50 dark:ring-blue-950/20"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="p-5 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-base shadow-inner select-none">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-gray-900 dark:text-gray-100 truncate text-sm transition-colors">
                          {student.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 gap-2 border-t border-b border-gray-100 dark:border-gray-800 py-3 text-xs">
                      <div>
                        <p className="text-gray-400 dark:text-gray-500 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">
                          Registered On
                        </p>
                        <p className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors">
                          📅 {registrationDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-gray-500 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">
                          Purchases
                        </p>
                        <p className="font-bold text-gray-700 dark:text-gray-300 transition-colors">
                          📚 {coursesCount} Course
                          {coursesCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Courses List Sub-display */}
                    {coursesCount > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {student.purchasedCourses.map((c) => (
                          <span
                            key={c._id}
                            className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full"
                          >
                            {c.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions and Toggle */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs">
                        {quizCount === 0 ? (
                          <span className="text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 px-2 py-1 rounded-full font-bold">
                            No Attempts
                          </span>
                        ) : (
                          <span className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 font-extrabold px-2.5 py-1 rounded-full">
                            ⭐ {quizCount} Quiz{quizCount > 1 ? "zes" : ""}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpand(student._id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isExpanded
                            ? "bg-gray-800 text-white border-gray-800 dark:bg-gray-100 dark:text-black dark:border-gray-200"
                            : "bg-white text-blue-600 border-gray-200 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-400 dark:border-gray-800 dark:hover:bg-blue-950/20"
                        }`}
                      >
                        {isExpanded ? "Close" : "View Quizzes"}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Quiz Grades Drawer for Mobile */}
                  {isExpanded && (
                    <div className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3 transition-colors">
                      <h4 className="font-extrabold text-gray-800 dark:text-gray-300 text-xs flex items-center gap-1">
                        <span>📊</span> Quiz Grade Sheet
                      </h4>

                      {quizCount === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold py-2 text-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                          No quiz attempts yet.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {student.quizResults.map((q) => {
                            const passed = q.percentage >= 60;
                            return (
                              <div
                                key={q._id}
                                className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 flex flex-col gap-2 transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0">
                                    <p className="font-bold text-gray-850 dark:text-gray-150 text-xs truncate">
                                      {q.courseTitle}
                                    </p>
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                      Ch {q.chapterOrder}. {q.chapterTitle}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                      passed
                                        ? "bg-green-100 text-green-800 dark:bg-green-950/70 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-955/70 dark:text-red-400"
                                    }`}
                                  >
                                    {passed ? "Pass" : "Fail"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs">
                                  <div className="font-mono font-bold text-gray-700 dark:text-gray-300">
                                    {q.score}/{q.totalQuestions}
                                  </div>
                                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${q.percentage}%` }}
                                      className={`h-full rounded-full ${passed ? "bg-green-500" : "bg-red-500"}`}
                                    />
                                  </div>
                                  <span
                                    className={`font-mono font-extrabold ${passed ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                                  >
                                    {q.percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (Visible on 768px and above) */}
          <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Student Info</th>
                    <th className="px-6 py-4">Registration</th>
                    <th className="px-6 py-4">Courses Enrolled</th>
                    <th className="px-6 py-4">Quiz Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {students.map((student) => {
                    const isExpanded = expandedStudentId === student._id;
                    const quizCount = student.quizResults?.length || 0;
                    const coursesCount = student.purchasedCourses?.length || 0;
                    const registrationDate = new Date(
                      student.createdAt,
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <Fragment key={student._id}>
                        {/* Base Info Row */}
                        <tr
                          className={`hover:bg-gray-50/50 dark:hover:bg-gray-950/30 transition-colors ${isExpanded ? "bg-blue-50/10 dark:bg-blue-950/10" : ""}`}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-955 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-inner select-none">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900 dark:text-gray-100 transition-colors">
                                  {student.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-bold text-xs">
                            📅 {registrationDate}
                          </td>
                          <td className="px-6 py-5">
                            {coursesCount === 0 ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 px-2 py-0.5 rounded-full font-bold">
                                None
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[300px]">
                                {student.purchasedCourses.map((c) => (
                                  <span
                                    key={c._id}
                                    className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full"
                                    title={`₹${c.price}`}
                                  >
                                    {c.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {quizCount === 0 ? (
                              <span className="text-xs text-gray-400 dark:text-gray-555 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 px-2 py-0.5 rounded-full font-bold">
                                No Attempts
                              </span>
                            ) : (
                              <span className="text-xs font-bold bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full">
                                ⭐ {quizCount} Quiz{quizCount > 1 ? "zes" : ""}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => toggleExpand(student._id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                isExpanded
                                  ? "bg-gray-800 text-white border-gray-800 dark:bg-gray-100 dark:text-black dark:border-gray-250"
                                  : "bg-white text-blue-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-400 dark:border-gray-800 dark:hover:bg-blue-950/20"
                              }`}
                            >
                              {isExpanded ? "Close" : "View Quizzes"}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Quiz Grades Area */}
                        {isExpanded && (
                          <tr>
                            <td
                              colSpan="5"
                              className="bg-gray-50/50 dark:bg-gray-950/50 border-t border-b border-gray-200 dark:border-gray-800 p-6 transition-colors"
                            >
                              <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-sm mb-4 flex items-center gap-1.5">
                                <span>📊</span> Quiz Grade Sheet for{" "}
                                {student.name}
                              </h3>

                              {quizCount === 0 ? (
                                <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    This student has not submitted any quizzes
                                    yet.
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-805 rounded-xl shadow-sm overflow-hidden">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-gray-100/80 dark:bg-gray-950/80 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-4 py-3">Course</th>
                                        <th className="px-4 py-3">Chapter</th>
                                        <th className="px-4 py-3">Raw Score</th>
                                        <th className="px-4 py-3">Grade</th>
                                        <th className="px-4 py-3">
                                          Performance
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                                      {student.quizResults.map((q) => {
                                        const passed = q.percentage >= 60;
                                        return (
                                          <tr
                                            key={q._id}
                                            className="hover:bg-gray-55 dark:hover:bg-gray-950/50 transition-colors"
                                          >
                                            <td className="px-4 py-3.5 font-bold text-indigo-700 dark:text-indigo-400">
                                              {q.courseTitle}
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                                              Ch {q.chapterOrder}.{" "}
                                              {q.chapterTitle}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-bold text-gray-700 dark:text-gray-300">
                                              {q.score} / {q.totalQuestions}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-bold">
                                              <span
                                                className={
                                                  passed
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-red-500 dark:text-red-400"
                                                }
                                              >
                                                {q.percentage}%
                                              </span>
                                            </td>
                                            <td className="px-4 py-3.5 w-1/3">
                                              <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                  <div
                                                    style={{
                                                      width: `${q.percentage}%`,
                                                    }}
                                                    className={`h-full rounded-full ${passed ? "bg-green-500" : "bg-red-500"}`}
                                                  />
                                                </div>
                                                <span
                                                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                    passed
                                                      ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400"
                                                      : "bg-red-100 text-red-800 dark:bg-red-955/60 dark:text-red-400"
                                                  }`}
                                                >
                                                  {passed ? "Pass" : "Fail"}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AllStudents;
