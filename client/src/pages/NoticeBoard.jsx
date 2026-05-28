// src/pages/NoticeBoard.jsx
import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const NoticeBoard = () => {
  const { user } = useContext(AuthContext);
  
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notice creation form states
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("text"); // 'text' | 'image' | 'poll'
  const [imageUrl, setImageUrl] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]); // Start with 2 options
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments & Replies state
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);
  const [newCommentText, setNewCommentText] = useState({}); // { noticeId: text }
  const [isCommenting, setIsCommenting] = useState(false);

  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [newReplyText, setNewReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchNotices = async () => {
    try {
      const response = await api.get("/notices");
      setNotices(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notice board.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleAddOptionField = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOptionField = (index) => {
    if (pollOptions.length > 2) {
      const updated = [...pollOptions];
      updated.splice(index, 1);
      setPollOptions(updated);
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type,
        imageUrl: type === "image" ? imageUrl.trim() : "",
      };

      if (type === "poll") {
        const filteredOptions = pollOptions.filter(opt => opt.trim() !== "");
        if (!pollQuestion.trim()) {
          alert("Poll question is required.");
          setIsSubmitting(false);
          return;
        }
        if (filteredOptions.length < 2) {
          alert("Please add at least 2 valid options.");
          setIsSubmitting(false);
          return;
        }
        payload.pollQuestion = pollQuestion.trim();
        payload.pollOptions = filteredOptions;
      }

      const response = await api.post("/notices", payload);
      setNotices([response.data, ...notices]);
      
      // Reset form
      setTitle("");
      setContent("");
      setType("text");
      setImageUrl("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setFormOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm("Are you sure you want to delete this notice permanently?")) return;
    try {
      await api.delete(`/notices/${noticeId}`);
      setNotices(notices.filter((n) => n._id !== noticeId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete notice.");
    }
  };

  const handleVote = async (noticeId, optionId) => {
    if (user?.role === "teacher") {
      alert("Teachers are not allowed to vote in polls.");
      return;
    }
    try {
      const response = await api.post(`/notices/${noticeId}/vote`, { optionId });
      // Update notices list with new voting states
      setNotices(notices.map((n) => (n._id === noticeId ? response.data : n)));
    } catch (err) {
      alert(err.response?.data?.message || "Voting failed.");
    }
  };

  const handleAddComment = async (noticeId) => {
    const text = newCommentText[noticeId];
    if (!text || text.trim() === "") return;

    setIsCommenting(true);
    try {
      const response = await api.post(`/notices/${noticeId}/comment`, { commentText: text });
      setNotices(notices.map((n) => (n._id === noticeId ? response.data : n)));
      setNewCommentText({ ...newCommentText, [noticeId]: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add comment.");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (noticeId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const response = await api.delete(`/notices/${noticeId}/comment/${commentId}`);
      setNotices(notices.map((n) => (n._id === noticeId ? response.data : n)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const handleAddReply = async (noticeId, commentId) => {
    if (!newReplyText || newReplyText.trim() === "") return;
    setIsSubmittingReply(true);
    try {
      const response = await api.post(`/notices/${noticeId}/comment/${commentId}/reply`, { replyText: newReplyText });
      setNotices(notices.map((n) => (n._id === noticeId ? response.data : n)));
      setNewReplyText("");
      setReplyingToCommentId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add reply.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (noticeId, commentId, replyId) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      const response = await api.delete(`/notices/${noticeId}/comment/${commentId}/reply/${replyId}`);
      setNotices(notices.map((n) => (n._id === noticeId ? response.data : n)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete reply.");
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header and navigation breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>&gt;</span>
            <span className="text-gray-900 dark:text-gray-100 font-bold transition-colors">Notice Board</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight transition-colors">Notice Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium transition-colors">
            Stay updated with corporate announcements, active community polls, and course notifications.
          </p>
        </div>
      </div>

      {/* Teacher Action Panel */}
      {user?.role === "teacher" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-8 shadow-sm transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">📢</span>
              <h2 className="font-extrabold text-gray-900 dark:text-gray-100 text-base transition-colors">Teacher Announcement Center</h2>
            </div>
            <button
              onClick={() => setFormOpen(!formOpen)}
              className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer select-none ${
                formOpen 
                  ? "bg-gray-800 text-white border-gray-850 dark:bg-gray-100 dark:text-black dark:border-gray-200" 
                  : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-950/70"
              }`}
            >
              {formOpen ? "Cancel Notice" : "+ Draft New Notice"}
            </button>
          </div>

          {formOpen && (
            <form onSubmit={handleCreateNotice} className="mt-5 border-t border-gray-200 dark:border-gray-850 pt-5 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="notice-title" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Notice Title</label>
                  <input
                    id="notice-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Virtual Hackathon 2026 Scheduled!"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="notice-type" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Notice Type</label>
                  <select
                    id="notice-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <option value="text">Announcement (Text Only)</option>
                    <option value="image">Poster (Image Bulletin)</option>
                    <option value="poll">Interactive Poll</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notice-content" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Announcement Body</label>
                <textarea
                  id="notice-content"
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide complete descriptions or important instructions for the student body..."
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 resize-none transition-colors"
                />
              </div>

              {type === "image" && (
                <div className="animate-fade-in">
                  <label htmlFor="notice-image" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Bulletin Image URL</label>
                  <input
                    id="notice-image"
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                  {imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 max-h-[200px] aspect-video bg-gray-50 dark:bg-gray-950">
                      <img src={imageUrl} alt="bulletin preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    </div>
                  )}
                </div>
              )}

              {type === "poll" && (
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4 animate-fade-in transition-colors">
                  <div>
                    <label htmlFor="poll-question" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Poll Question</label>
                    <input
                      id="poll-question"
                      type="text"
                      required
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="e.g. Which programming language do you prefer for Backend development?"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Poll Choices</label>
                    {pollOptions.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-400 dark:text-gray-600 font-mono w-5">#{index + 1}</span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Choice Option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionField(index)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold px-2 py-1 select-none cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    {pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddOptionField}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/35 hover:bg-indigo-100 dark:hover:bg-indigo-950/65 px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        + Add Choice Option
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold py-2.5 rounded-lg transition-all cursor-pointer disabled:bg-gray-300 dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
              >
                {isSubmitting ? "Publishing Notice..." : "Broadcast Announcement Notice"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Notice Board Stream */}
      {loading ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4 transition-all duration-300">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Loading notice stream...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 text-center text-red-800 dark:text-red-400 font-medium">
          ⚠️ {error}
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 text-center shadow-sm transition-all duration-300">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-gray-500 dark:text-gray-300 text-sm font-bold">The Notice Board is silent</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Announcements, bulletins, and community polls will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notices.map((notice) => {
            const hasImageUrl = notice.imageUrl && notice.imageUrl.trim() !== "";
            const isPoll = notice.type === "poll" && notice.poll;
            const commentsCount = notice.comments?.length || 0;
            const isExpanded = expandedNoticeId === notice._id;
            
            // Poll calculations
            let totalVotes = 0;
            let hasVoted = false;
            let userVotedOptionId = null;

            if (isPoll) {
              notice.poll.options.forEach((opt) => {
                totalVotes += opt.votes.length;
                if (user && opt.votes.includes(user._id)) {
                  hasVoted = true;
                  userVotedOptionId = opt._id;
                }
              });
              if (user && user.role === "teacher") {
                hasVoted = true; // Teachers see results directly and cannot vote
              }
            }

            return (
              <article 
                key={notice._id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 flex flex-col gap-4">
                  {/* Notice Author Info & Trash Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-inner select-none">
                        {notice.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-extrabold text-gray-900 dark:text-gray-100 text-sm transition-colors">{notice.authorName}</p>
                          <span className="text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                            Teacher
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                          📅 {formatDate(notice.createdAt)}
                        </p>
                      </div>
                    </div>

                    {user?.role === "teacher" && (
                      <button
                        onClick={() => handleDeleteNotice(notice._id)}
                        title="Delete Notice"
                        className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Title and Content */}
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg tracking-tight mb-2 transition-colors">
                      {notice.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap transition-colors">
                      {notice.content}
                    </p>
                  </div>

                  {/* Bulletins Image display - Image type bullet image ONLY shown if provided */}
                  {notice.type === "image" && hasImageUrl && (
                    <div className="rounded-xl overflow-hidden border border-gray-150 dark:border-gray-800 max-h-[350px] bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                      <img 
                        src={notice.imageUrl} 
                        alt="Notice media content" 
                        className="w-full h-full object-contain max-h-[350px]" 
                      />
                    </div>
                  )}

                  {/* Poll voting interface */}
                  {isPoll && (
                    <div className="bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl p-5 mt-1 space-y-4 transition-colors">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5 transition-colors">
                          <span>📊</span> {notice.poll.question}
                        </h4>
                        {user?.role === "teacher" && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full">
                            Teacher View (Live Results)
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {notice.poll.options.map((opt) => {
                          const optionVotes = opt.votes.length;
                          const pct = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                          const userSelectedThis = userVotedOptionId === opt._id;

                          return (
                            <div key={opt._id}>
                              {hasVoted ? (
                                /* Voted State (Progress Bars) */
                                <div 
                                  className={`relative border rounded-xl p-3 bg-white dark:bg-gray-900 transition-all overflow-hidden flex flex-col gap-1.5 ${
                                    userSelectedThis ? "border-green-300 dark:border-green-800 ring-2 ring-green-50 dark:ring-green-950/20" : "border-gray-150 dark:border-gray-800"
                                  }`}
                                >
                                  {/* Progress bar background fill */}
                                  <div 
                                    style={{ width: `${pct}%` }}
                                    className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ${
                                      userSelectedThis ? "bg-green-500/10 dark:bg-green-500/5" : "bg-blue-500/5 dark:bg-blue-500/5"
                                    }`}
                                  />
                                  <div className="flex justify-between items-center text-xs font-semibold relative z-10">
                                    <span className={`truncate flex items-center gap-1.5 ${userSelectedThis ? "text-green-800 dark:text-green-400 font-extrabold" : "text-gray-700 dark:text-gray-300"}`}>
                                      {opt.optionText}
                                      {userSelectedThis && <span className="text-[10px] bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-400 font-black px-1.5 py-0.25 rounded">Your Choice</span>}
                                    </span>
                                    <span className="font-mono text-gray-500 dark:text-gray-400 flex-shrink-0">{optionVotes} vote{optionVotes !== 1 ? "s" : ""} ({pct}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden relative z-10">
                                    <div 
                                      style={{ width: `${pct}%` }}
                                      className={`h-full rounded-full transition-all duration-1000 ${
                                        userSelectedThis ? "bg-green-500" : "bg-blue-600"
                                      }`}
                                    />
                                  </div>
                                </div>
                              ) : (
                                /* Voting State (Buttons) */
                                <button
                                  onClick={() => handleVote(notice._id, opt._id)}
                                  disabled={!user || user?.role === "teacher"}
                                  className="w-full text-left text-xs font-semibold px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/15 hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {opt.optionText}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 font-bold font-mono">
                        <span>Total Participants: {totalVotes}</span>
                        {!user && <span className="text-red-400 dark:text-red-400/80">Sign in to vote in polls</span>}
                      </div>
                    </div>
                  )}

                  {/* Notice Footer Details */}
                  <div className="flex items-center gap-4 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                    <button
                      onClick={() => setExpandedNoticeId(isExpanded ? null : notice._id)}
                      className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        isExpanded
                          ? "bg-gray-800 text-white border-gray-850 dark:bg-gray-100 dark:text-black dark:border-gray-200"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-850"
                      }`}
                    >
                      <span>💬</span> Discussion ({commentsCount})
                    </button>
                  </div>
                </div>

                {/* Collapsible Discussion Comments Drawer */}
                {isExpanded && (
                  <div className="bg-gray-50 dark:bg-gray-950/70 border-t border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-4 transition-colors">
                    <h4 className="font-extrabold text-gray-800 dark:text-gray-300 text-xs uppercase tracking-wider flex items-center gap-1">
                      <span>💬</span> Discussion Board
                    </h4>

                    {/* Comments list */}
                    {commentsCount === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold py-4 text-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-850 rounded-xl">
                        No responses yet. Join the conversation below!
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
                        {notice.comments.map((comment) => {
                          const isCommentTeacher = comment.userRole === "teacher";
                          return (
                            <div 
                              key={comment._id} 
                              className={`border rounded-xl p-4 flex flex-col gap-3 animate-fade-in transition-all ${
                                isCommentTeacher 
                                  ? "bg-indigo-50/20 dark:bg-indigo-950/15 border-indigo-200 dark:border-indigo-900/40 shadow-xs" 
                                  : "bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-850"
                              }`}
                            >
                              {/* Top row: Comment text and delete */}
                              <div className="flex justify-between items-start gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-extrabold text-xs ${isCommentTeacher ? "text-indigo-800 dark:text-indigo-400" : "text-gray-800 dark:text-gray-200"}`}>
                                      {comment.userName}
                                    </span>
                                    {isCommentTeacher && (
                                      <span className="text-[9px] font-black uppercase bg-indigo-100 dark:bg-indigo-955 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.25 rounded">
                                        Teacher
                                      </span>
                                    )}
                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold">
                                      {formatDate(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-xs mt-1.5 leading-relaxed whitespace-pre-wrap">
                                    {comment.commentText}
                                  </p>
                                </div>

                                {user?.role === "teacher" && (
                                  <button
                                    onClick={() => handleDeleteComment(notice._id, comment._id)}
                                    title="Delete Comment"
                                    className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer flex-shrink-0"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              {/* Nested Replies List */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-2 pl-4 border-l-2 border-gray-200 dark:border-gray-800 flex flex-col gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-2.5 rounded-r-xl">
                                  {comment.replies.map((reply) => {
                                    const isReplyTeacher = reply.userRole === "teacher";
                                    return (
                                      <div 
                                        key={reply._id} 
                                        className={`flex justify-between items-start gap-4 text-[11px] p-2.5 rounded-lg border transition-all ${
                                          isReplyTeacher 
                                            ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-150 dark:border-indigo-900/30 shadow-2xs" 
                                            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-850"
                                        }`}
                                      >
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`font-bold ${isReplyTeacher ? "text-indigo-800 dark:text-indigo-400 font-extrabold" : "text-gray-800 dark:text-gray-200"}`}>
                                              {reply.userName}
                                            </span>
                                            {isReplyTeacher && (
                                              <span className="text-[8px] font-black uppercase bg-indigo-100 dark:bg-indigo-955 text-indigo-700 dark:text-indigo-400 px-1 py-0.25 rounded">
                                                Teacher
                                              </span>
                                            )}
                                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold">
                                              {formatDate(reply.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-gray-600 dark:text-gray-450 mt-1 leading-relaxed whitespace-pre-wrap text-[11px]">
                                            {reply.replyText}
                                          </p>
                                        </div>

                                        {user?.role === "teacher" && (
                                          <button
                                            onClick={() => handleDeleteReply(notice._id, comment._id, reply._id)}
                                            title="Delete Reply"
                                            className="text-red-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-955 cursor-pointer flex-shrink-0"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Nested Reply Submission Field */}
                              {user && (
                                <div className="mt-1 flex items-center justify-start">
                                  {replyingToCommentId === comment._id ? (
                                    <div className="w-full flex flex-col gap-2 mt-1 pl-4 border-l-2 border-indigo-400 dark:border-indigo-650 animate-fade-in">
                                      <textarea
                                        rows={1}
                                        required
                                        value={newReplyText}
                                        onChange={(e) => setNewReplyText(e.target.value)}
                                        placeholder={`Reply to ${comment.userName}...`}
                                        className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none max-h-[60px]"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          onClick={() => {
                                            setReplyingToCommentId(null);
                                            setNewReplyText("");
                                          }}
                                          className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer select-none"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleAddReply(notice._id, comment._id)}
                                          disabled={isSubmittingReply || !newReplyText || newReplyText.trim() === ""}
                                          className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-800 dark:disabled:text-gray-650 px-3 py-1.5 rounded transition-all cursor-pointer select-none"
                                        >
                                          {isSubmittingReply ? "..." : "Post Reply"}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setReplyingToCommentId(comment._id);
                                        setNewReplyText("");
                                      }}
                                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/80 px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 select-none"
                                    >
                                      <span>↩️</span> Reply
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* New comment input */}
                    {user ? (
                      <div className="flex gap-2 items-start mt-2 border-t border-gray-200 dark:border-gray-800 pt-4">
                        <textarea
                          rows={1}
                          value={newCommentText[notice._id] || ""}
                          onChange={(e) => setNewCommentText({ ...newCommentText, [notice._id]: e.target.value })}
                          placeholder="Write a constructive response or question..."
                          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none max-h-[60px]"
                        />
                        <button
                          onClick={() => handleAddComment(notice._id)}
                          disabled={isCommenting || !newCommentText[notice._id] || newCommentText[notice._id].trim() === ""}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer disabled:bg-gray-300 dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
                        >
                          {isCommenting ? "..." : "Send"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg py-2 mt-2">
                        You must be signed in to post comments.
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
