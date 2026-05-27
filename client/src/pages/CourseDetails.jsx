// src/pages/CourseDetails.jsx
import { useState, useEffect, useContext } from "react"; // Add useContext
import { useParams, useNavigate } from "react-router-dom"; // Add useNavigate
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext"; // Import AuthContext

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Get the logged-in user

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await api.get(`/courses/${courseId}`);
        setCourse(response.data.course);
        setChapters(response.data.chapters);
        if (response.data.chapters.length > 0) {
          setActiveChapter(response.data.chapters[0]);
        }
      } catch (err) {
        setError("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);

  // The Checkout Trigger Function
  const handleBuyCourse = async () => {
    // Security check: If not logged in, force them to the login page
    if (!user) {
      return navigate("/login");
    }

    setCheckoutLoading(true);
    try {
      // Hit the payment initiation route we built in the backend
      const response = await api.post("/payments/initiate", { courseId });

      // PhonePe returns a secure hosted checkout URL
      // window.location.href forces the browser to redirect to PhonePe's screen
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed to initialize.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading course...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!course) return <div className="p-8 text-center">Course not found.</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      {/* LEFT SIDE: Video Player */}
      <div className="lg:w-2/3">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          {course.title}
        </h1>
        {activeChapter ? (
          <div className="bg-black rounded-lg overflow-hidden shadow-lg aspect-video w-full mb-6">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${activeChapter.youtubeVideoId}`}
              title={activeChapter.title}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="bg-gray-200 aspect-video rounded-lg flex items-center justify-center mb-6">
            <p className="text-gray-500">No video available</p>
          </div>
        )}
        <h2 className="text-2xl font-semibold mb-2">{activeChapter?.title}</h2>
        <p className="text-gray-700 whitespace-pre-wrap">
          {course.description}
        </p>
      </div>

      {/* RIGHT SIDE: Sidebar Playlist */}
      <div className="lg:w-1/3">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm sticky top-8">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">
            Course Content
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {chapters.map((chapter) => (
              <button
                key={chapter._id}
                onClick={() => setActiveChapter(chapter)}
                className={`w-full text-left px-4 py-3 rounded transition-colors ${
                  activeChapter?._id === chapter._id
                    ? "bg-blue-50 border-l-4 border-blue-600 font-medium text-blue-800"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                {chapter.order}. {chapter.title}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            {/* Update this button with the click handler */}
            <button
              onClick={handleBuyCourse}
              disabled={checkoutLoading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {checkoutLoading
                ? "Opening PhonePe..."
                : `Buy Course - ₹${course.price}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
