// src/components/CourseCard.jsx
import { Link } from "react-router-dom";

const CourseCard = ({ course }) => {
  return (
    <Link
      to={`/course/${course._id}`}
      className="group block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14m0 0V10m0 4H5a2 2 0 01-2-2V8a2 2 0 012-2h10v8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug line-clamp-2 mb-1 transition-colors">
          {course.title}
        </h2>
        {course.instructor?.name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            by {course.instructor.name}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100 transition-colors">
            ₹{course.price}
          </span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-transparent dark:border-blue-900/30 px-2.5 py-1 rounded-full">
            View Course →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
