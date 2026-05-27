// src/components/CourseCard.jsx
import { Link } from "react-router-dom";

const CourseCard = ({ course }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <h3 className="text-xl font-bold mb-2 text-gray-800">{course.title}</h3>
      <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

      <div className="flex justify-between items-center mt-4">
        <span className="font-semibold text-lg text-green-600">
          ₹{course.price}
        </span>

        <Link
          to={`/course/${course._id}`}
          className="bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
