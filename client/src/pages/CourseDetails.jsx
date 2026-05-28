// src/pages/CourseDetails.jsx
import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext";

// ─── Custom Hybrid Video Player ───────────────────────────────────
const CustomVideoPlayer = ({ src, title }) => {
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const playerContainerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");

  // Extract YT ID
  const extractYTId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const ytVideoId = isYouTube ? extractYTId(src) : null;

  // Toggle Play/Pause
  const togglePlay = () => {
    if (isYouTube) {
      if (!ytPlayerRef.current) return;
      const state = ytPlayerRef.current.getPlayerState
        ? ytPlayerRef.current.getPlayerState()
        : -1;
      if (state === 1) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // HTML5 Native Video Callbacks
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Sync volume from native video changes
  const handleVolumeChangeFromVideo = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted || videoRef.current.volume === 0);
    }
  };

  // Seek
  const handleSeek = (e) => {
    if (duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const newTime = percentage * duration;

    if (isYouTube) {
      if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
        ytPlayerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  // Volume Changes
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const nextMuted = val === 0;
    setIsMuted(nextMuted);

    if (isYouTube) {
      if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
        ytPlayerRef.current.setVolume(val * 100);
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unmute();
        }
      }
    } else {
      if (videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = nextMuted;
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYouTube) {
      if (ytPlayerRef.current) {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unmute();
        }
      }
    } else {
      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
      }
    }
  };

  // Playback Rate
  const handleSpeedChange = (e) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);

    if (isYouTube) {
      if (ytPlayerRef.current && ytPlayerRef.current.setPlaybackRate) {
        ytPlayerRef.current.setPlaybackRate(rate);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
      }
    }
  };

  // Fullscreen
  const handleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2500);
  };

  // Reset player when source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);
    setShowControls(true);

    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
      videoRef.current.pause();
      videoRef.current.load();
    }
  }, [src]);

  // YouTube IFrame API Initialization
  useEffect(() => {
    if (!isYouTube || !ytVideoId) return;

    let playerInstance = null;

    const createPlayer = () => {
      if (!ytContainerRef.current) return;

      playerInstance = new window.YT.Player(ytContainerRef.current, {
        videoId: ytVideoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            ytPlayerRef.current = event.target;
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(isMuted ? 0 : volume * 100);
            event.target.setPlaybackRate(playbackRate);
          },
          onStateChange: (event) => {
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = createPlayer;
    } else if (window.YT && window.YT.Player) {
      createPlayer();
    }

    return () => {
      if (playerInstance && playerInstance.destroy) {
        playerInstance.destroy();
      }
      ytPlayerRef.current = null;
    };
  }, [src, isYouTube, ytVideoId]);

  // Progress polling for YouTube
  useEffect(() => {
    let timer = null;
    if (isPlaying && isYouTube) {
      timer = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          setCurrentTime(ytPlayerRef.current.getCurrentTime());
          if (duration === 0 && ytPlayerRef.current.getDuration) {
            setDuration(ytPlayerRef.current.getDuration());
          }
        }
      }, 250);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isYouTube, duration]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Format time
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      className="relative bg-black w-full h-full group overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Content Wrapper */}
      <div className="w-full h-full relative">
        {isYouTube ? (
          <div className="w-full h-full relative overflow-hidden">
            {/* Transparent pointer-events blocker & click capture overlay */}
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={togglePlay}
            />
            <div ref={ytContainerRef} className="w-full h-full" />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onVolumeChange={handleVolumeChangeFromVideo}
            playsInline
          />
        )}
      </div>

      {/* Large play overlay button in center when paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-all duration-300 animate-fade-in z-10"
        >
          <div className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all text-white flex items-center justify-center shadow-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              className="w-8 h-8 ml-1"
              viewBox="0 0 16 16"
            >
              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom controls panel with premium fade & slide transition */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-3 transition-all duration-300 ease-out z-20 ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Progress Seek Bar */}
        <div
          onClick={handleSeek}
          className="relative h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2 transition-all flex items-center"
        >
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-blue-600 rounded-full relative transition-all duration-75"
          />
          <div
            style={{ left: `calc(${progressPercent}% - 6px)` }}
            className="absolute w-3 h-3 rounded-full bg-white shadow scale-0 hover:scale-100 group-hover:scale-100 transition-transform"
          />
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center justify-between text-white text-sm select-none">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="hover:text-blue-400 active:scale-90 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="w-5 h-5"
                  viewBox="0 0 16 16"
                >
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="w-5 h-5"
                  viewBox="0 0 16 16"
                >
                  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <span className="font-mono text-xs text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume controls */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={toggleMute}
                className="hover:text-blue-400 active:scale-90 transition-all cursor-pointer"
              >
                {isMuted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                  >
                    <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                  >
                    <path d="M11.536 14.01A8.473 8.473 0 0 0 14 8c0-2.29-.904-4.37-2.37-5.914a.5.5 0 0 0-.742.672A7.476 7.476 0 0 1 13 8c0 2.022-.812 3.854-2.124 5.184a.5.5 0 1 0 .76.646zm-2.93-2.93a5.474 5.474 0 0 0 1.637-3.805c0-1.503-.604-2.864-1.58-3.847a.5.5 0 1 0-.708.708C8.75 4.908 9.25 5.897 9.25 7c0 1.103-.45 2.092-1.213 2.853a.5.5 0 1 0 .708.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 rounded-lg accent-blue-600 bg-white/30 cursor-pointer hidden group-hover/volume:block transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center gap-1">
              <span className="text-white/60 text-xs">Speed:</span>
              <select
                value={playbackRate}
                onChange={handleSpeedChange}
                className="bg-black/60 border border-white/20 text-white rounded text-xs px-1.5 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1.0x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="hover:text-blue-400 active:scale-90 transition-all cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-4 h-4"
                viewBox="0 0 16 16"
              >
                <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-4ZM11 .5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1-.5-.5ZM.5 11a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 .5-.5Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Quiz component for a single chapter ────────────────────────
const ChapterQuiz = ({ chapterId, isTeacher }) => {
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({}); // { questionIndex: optionIndex }
  const [result, setResult] = useState(null); // null | { score, total, percentage, breakdown }
  const [pastResult, setPastResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!chapterId) return;
    setQuiz([]);
    setSelected({});
    setResult(null);
    setPastResult(null);
    setLoading(true);

    const fetch = async () => {
      try {
        const [quizRes, resultRes] = await Promise.all([
          api.get(`/quiz/${chapterId}`),
          !isTeacher
            ? api.get(`/quiz/${chapterId}/my-result`)
            : Promise.resolve({ data: null }),
        ]);
        setQuiz(quizRes.data.quiz || []);
        if (resultRes.data?.attempted) setPastResult(resultRes.data);
      } catch {
        // Silently fail — no quiz is fine
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [chapterId]);

  const handleSubmit = async () => {
    if (Object.keys(selected).length !== quiz.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const answers = quiz.map((_, i) => selected[i] ?? -1);
      const res = await api.post(`/quiz/${chapterId}/submit`, { answers });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-4 transition-colors">
        Loading quiz...
      </p>
    );
  if (quiz.length === 0)
    return (
      <div className="py-6 text-center text-gray-400 dark:text-gray-500 text-sm transition-colors">
        {isTeacher
          ? "No quiz questions added to this chapter yet. Add them from the Teacher Dashboard."
          : "No quiz available for this chapter."}
      </div>
    );

  // Show result screen
  if (result) {
    const pct = result.percentage;
    const passed = pct >= 60;
    return (
      <div className="py-4">
        <div
          className={`rounded-xl p-6 text-center mb-6 transition-colors ${
            passed
              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/35 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/35 text-red-700 dark:text-red-400"
          }`}
        >
          <div className="text-4xl mb-2">{passed ? "🎉" : "📚"}</div>
          <h3 className="text-2xl font-extrabold">{pct}%</h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            {result.score} / {result.totalQuestions} correct &nbsp;·&nbsp;{" "}
            {passed ? "Passed!" : "Keep practicing!"}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {result.breakdown.map((item, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border text-sm transition-colors ${
                item.isCorrect
                  ? "bg-green-50 dark:bg-green-955/25 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-955/25 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300"
              }`}
            >
              <p className="font-semibold mb-1">
                Q{i + 1}. {item.question}
              </p>
              <p
                className={`text-xs font-medium ${item.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {item.isCorrect
                  ? "✅ Correct"
                  : `❌ Wrong — Correct: Option ${item.correct + 1}`}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setResult(null);
            setSelected({});
          }}
          className="mt-4 w-full text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer select-none"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-5">
      {/* Past result banner */}
      {pastResult && !result && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 rounded-lg px-4 py-2 text-sm text-blue-700 dark:text-blue-400 font-medium transition-colors">
          Your last score:{" "}
          <strong>
            {pastResult.score}/{pastResult.totalQuestions}
          </strong>{" "}
          ({pastResult.percentage}%) &nbsp;— Retake to improve!
        </div>
      )}

      {quiz.map((q, qi) => (
        <div
          key={q._id || qi}
          className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-colors"
        >
          <p className="font-semibold text-gray-850 dark:text-gray-150 text-sm mb-3 transition-colors">
            {qi + 1}. {q.question}
            {isTeacher && q.correctAnswerIndex !== undefined && (
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-950/70 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium transition-colors">
                Answer: Option {q.correctAnswerIndex + 1}
              </span>
            )}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                disabled={isTeacher}
                onClick={() => setSelected((prev) => ({ ...prev, [qi]: oi }))}
                className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                  selected[qi] === oi
                    ? "bg-blue-600 text-white border-blue-600 font-semibold"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/15"
                } ${isTeacher ? "cursor-default" : "cursor-pointer"}`}
              >
                {String.fromCharCode(65 + oi)}. {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!isTeacher && (
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(selected).length !== quiz.length}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-600 cursor-pointer"
        >
          {submitting
            ? "Grading..."
            : `Submit Quiz (${Object.keys(selected).length}/${quiz.length} answered)`}
        </button>
      )}
    </div>
  );
};

// ─── Main CourseDetails Page ──────────────────────────────────────
const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeTab, setActiveTab] = useState("video"); // "video" | "quiz"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const isTeacher = user?.role === "teacher";
  const isEnrolled =
    user?.purchasedCourses?.map(String).includes(String(courseId)) ?? false;
  // Teachers always get access; enrolled students get access
  const isAccessible = isTeacher || isEnrolled;

  // Compute dynamic video source (MP4 url or YouTube watch URL)
  const getChapterVideoSrc = (chapter) => {
    if (!chapter) return null;
    if (
      chapter.videoUrl &&
      chapter.videoUrl !== "undefined" &&
      chapter.videoUrl !== "null"
    ) {
      return chapter.videoUrl;
    }
    if (chapter.youtubeVideoId) {
      return `https://www.youtube.com/watch?v=${chapter.youtubeVideoId}`;
    }
    return null;
  };

  const videoSrc = getChapterVideoSrc(activeChapter);

  const handleToggleVisibility = async (chapterId) => {
    try {
      const response = await api.patch(
        `/courses/chapters/${chapterId}/visibility`,
      );
      // Update chapters array
      setChapters((prev) =>
        prev.map((ch) => {
          if (ch._id === chapterId) {
            return { ...ch, isVisible: response.data.isVisible };
          }
          return ch;
        }),
      );
      // Update active chapter if it was the one toggled
      if (activeChapter?._id === chapterId) {
        setActiveChapter((prev) => ({
          ...prev,
          isVisible: response.data.isVisible,
        }));
      }
    } catch {
      alert("Failed to toggle chapter visibility.");
    }
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await api.get(`/courses/${courseId}`);
        setCourse(response.data.course);
        setChapters(response.data.chapters);
        if (response.data.chapters.length > 0) {
          setActiveChapter(response.data.chapters[0]);
        }
      } catch {
        setError("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);

  // Reset to video tab when chapter changes
  useEffect(() => {
    setActiveTab("video");
  }, [activeChapter?._id]);

  const handleBuyCourse = async () => {
    if (!user) return navigate("/login");
    const storedToken = localStorage.getItem("lms_token");
    if (!storedToken) return navigate("/login");

    setCheckoutLoading(true);
    try {
      const response = await api.post("/payments/initiate", { courseId });
      if (response.data.url) window.location.href = response.data.url;
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed to initialize.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
        Loading course...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500 dark:text-red-400 transition-colors">
        {error}
      </div>
    );
  if (!course)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
        Course not found.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      {/* ──────────── LEFT: Player + Quiz ──────────── */}
      <div className="lg:w-2/3">
        <h1 className="text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100 transition-colors">
          {course.title}
        </h1>
        {isTeacher && (
          <span className="inline-block mb-4 text-xs bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-transparent dark:border-indigo-900/35 font-semibold px-2.5 py-0.5 rounded-full transition-colors">
            👨‍🏫 Viewing as Teacher — Full Access
          </span>
        )}

        {/* Video Player or Locked Placeholder */}
        {isAccessible ? (
          activeChapter ? (
            <div className="bg-black rounded-lg overflow-hidden shadow-lg aspect-video w-full mb-4">
              {videoSrc ? (
                <CustomVideoPlayer src={videoSrc} title={activeChapter.title} />
              ) : (
                <div className="bg-gray-900 aspect-video flex items-center justify-center">
                  <p className="text-gray-400 text-sm">
                    No video content linked to this chapter.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-200 dark:bg-gray-800 aspect-video rounded-lg flex items-center justify-center mb-4 transition-colors">
              <p className="text-gray-500 dark:text-gray-400">
                No video available
              </p>
            </div>
          )
        ) : (
          <div className="relative aspect-video rounded-lg overflow-hidden mb-4 shadow-lg">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
            )}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m-1.5 0h12a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 014.5 19v-7A1.5 1.5 0 016 10.5z"
                />
              </svg>
              <button
                onClick={handleBuyCourse}
                disabled={checkoutLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-2.5 rounded-lg active:scale-95 shadow transition-all cursor-pointer disabled:bg-gray-550"
              >
                {checkoutLoading
                  ? "Initiating..."
                  : `Unlock All Chapters for ₹${course.price}`}
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar — only show when accessible */}
        {isAccessible && activeChapter && (
          <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4 transition-colors">
            <button
              onClick={() => setActiveTab("video")}
              className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === "video"
                  ? "border-blue-600 text-blue-700 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-850 dark:hover:text-gray-200"
              }`}
            >
              📹 About
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === "quiz"
                  ? "border-blue-600 text-blue-700 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-850 dark:hover:text-gray-200"
              }`}
            >
              📝 Quiz
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "video" || !isAccessible ? (
          <div className="transition-colors">
            <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">
              {activeChapter?.title}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed mt-2">
              {course.description}
            </p>
          </div>
        ) : (
          <ChapterQuiz chapterId={activeChapter?._id} isTeacher={isTeacher} />
        )}
      </div>

      {/* ──────────── RIGHT: Sidebar ──────────── */}
      <div className="lg:w-1/3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm lg:sticky lg:top-8 transition-colors duration-300">
          <h3 className="text-xl font-bold mb-4 border-b dark:border-gray-800 pb-2 text-gray-900 dark:text-gray-100">
            Course Content
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {chapters.map((chapter) => {
              const isChapterActive = activeChapter?._id === chapter._id;
              return (
                <div
                  key={chapter._id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded transition-colors border ${
                    isChapterActive
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/35 text-blue-800 dark:text-blue-400 font-medium"
                      : "hover:bg-gray-50 dark:hover:bg-gray-950 border-transparent text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <button
                    disabled={!isAccessible}
                    onClick={() => isAccessible && setActiveChapter(chapter)}
                    className={`flex-1 text-left flex items-center gap-2 text-sm ${
                      !isAccessible
                        ? "cursor-default text-gray-400 dark:text-gray-500"
                        : "cursor-pointer"
                    }`}
                  >
                    {!isAccessible && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                    <span className="truncate">
                      {chapter.order}. {chapter.title}
                      {!chapter.isVisible && (
                        <span className="ml-1.5 text-[10px] bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 px-1.5 py-0.25 rounded uppercase font-bold">
                          Hidden
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Teacher Visibility Switch */}
                  {isTeacher && (
                    <button
                      onClick={() => handleToggleVisibility(chapter._id)}
                      className={`text-xs font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                        chapter.isVisible
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100"
                          : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-250 dark:border-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100"
                      }`}
                    >
                      {chapter.isVisible ? "Visible" : "Draft"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
