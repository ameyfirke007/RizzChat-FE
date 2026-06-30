
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FiPlus, FiMessageCircle } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import axios from "axios";
import "./Form.css";
import "./Photos.css";

let API = window.location.hostname === "localhost" 
  ? "http://localhost:3000" 
  : "https://rizzchat-be-pejo.onrender.com";

function Photos(){
  let [files, setFiles] = useState([]);
  let [file, setFile] = useState(null);
  let [caption, setCaption] = useState("");
  let [uploading, setUploading] = useState(false);
  let [showForm, setShowForm] = useState(false);
  let [email, setEmail] = useState(null);
  
  // States for expandable comments and text inputs per snap ID
  let [expandedComments, setExpandedComments] = useState({});
  let [commentInputs, setCommentInputs] = useState({});
  
  let endRef = useRef(null);

  let auth = getAuth();
  let nav = useNavigate();

  useEffect(()=>{
    let unsubscribe = onAuthStateChanged(auth,(user)=>{
      if(!user) nav("/login");
      else setEmail(user.email);
    });
    return ()=>unsubscribe();
  } , [] );

  let loadFiles = () => {
    axios.get(`${API}/files`)
      .then((res)=>setFiles(res.data))
      .catch((err)=>alert(err));
  };

  useEffect(()=>{
    loadFiles();
  } , [] );

  useEffect(()=>{
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  } , [files] );

  let closeForm = () => {
    setShowForm(false);
    setFile(null);
    setCaption("");
  };

  let handleUpload = (event) => {
    event.preventDefault();

    if(!file){
      alert("Please choose an image");
      return;
    }
    if(caption === ""){
      alert("Caption cannot be empty");
      return;
    }

    let formData = new FormData();
    formData.append("file", file);
    formData.append("caption", caption);
    formData.append("username", email);

    setUploading(true);
    axios.post(`${API}/upload`, formData)
      .then(()=>{
        closeForm();
        loadFiles();
      })
      .catch((err)=>alert(err))
      .finally(()=>setUploading(false));
  };

  let handleDelete = (id) => {
    axios.delete(`${API}/delete/${id}`)
      .then(()=>loadFiles())
      .catch((err)=>alert(err));
  };

  let handleLike = (id) => {
    axios.put(`${API}/files/${id}/like`, { username: email })
      .then((res) => {
        setFiles((prev) => prev.map((item) => {
          if (item._id === id) {
            return { ...item, likes: res.data.likes };
          }
          return item;
        }));
      })
      .catch((err) => alert(err));
  };

  let toggleComments = (id) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  let handleCommentInputChange = (id, text) => {
    setCommentInputs((prev) => ({
      ...prev,
      [id]: text
    }));
  };

  let handleAddComment = (id) => {
    let text = commentInputs[id];
    if (!text || !text.trim()) return;

    axios.post(`${API}/files/${id}/comment`, { username: email, text: text.trim() })
      .then((res) => {
        setFiles((prev) => prev.map((item) => {
          if (item._id === id) {
            return { ...item, comments: res.data.comments };
          }
          return item;
        }));
        setCommentInputs((prev) => ({ ...prev, [id]: "" }));
      })
      .catch((err) => alert(err));
  };

  let handleDeleteComment = (snapId, commentId) => {
    axios.delete(`${API}/files/${snapId}/comment/${commentId}`)
      .then((res) => {
        setFiles((prev) => prev.map((item) => {
          if (item._id === snapId) {
            return { ...item, comments: res.data.comments };
          }
          return item;
        }));
      })
      .catch((err) => alert(err));
  };

  return (
    <div className="container">
      <div className="form-box">
        <h2>Snaps</h2>

        <div className="button-group">
          <button onClick={()=>setShowForm(true)} style={{ backgroundColor: "#007bff", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <FiPlus /> Add Snap
          </button>

          <button onClick={()=>nav("/home")} style={{ backgroundColor: "#6c757d" }}>
            Home
          </button>
        </div>

        <div className="post-feed">
          {files.map((item)=>{
            let mine = item.username === email;
            let liked = item.likes?.includes(email);
            let likesCount = item.likes?.length || 0;
            let commentsCount = item.comments?.length || 0;
            let commentsOpen = !!expandedComments[item._id];

            return (
              <div className={`post-row ${mine ? "sent" : "received"}`} key={item._id}>
                <div className="post-sender">
                  <span>{item.username}</span>
                  {mine && (
                    <button
                      className="post-delete"
                      onClick={()=>handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="post-bubble">
                  <img className="post-image" src={item.file_url} alt={item.caption} />
                  <div className="post-caption">{item.caption}</div>
                  
                  {/* Actions Area (Likes & Comments counts) */}
                  <div className="post-actions">
                    <button className={`action-btn like-btn ${liked ? "liked" : ""}`} onClick={() => handleLike(item._id)}>
                      {liked ? <FaHeart /> : <FaRegHeart />}
                      <span>{likesCount}</span>
                    </button>

                    <button className={`action-btn comment-btn ${commentsOpen ? "active" : ""}`} onClick={() => toggleComments(item._id)}>
                      <FiMessageCircle />
                      <span>{commentsCount}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Comments Section */}
                {commentsOpen && (
                  <div className="comments-section">
                    <div className="comments-list">
                      {item.comments && item.comments.length > 0 ? (
                        item.comments.map((comment) => {
                          let isOwnComment = comment.username === email;
                          return (
                            <div key={comment._id} className="comment-item">
                              <div className="comment-header">
                                <span className="comment-user">{comment.username}</span>
                                {isOwnComment && (
                                  <button
                                    className="comment-delete-btn"
                                    onClick={() => handleDeleteComment(item._id, comment._id)}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              <div className="comment-body">{comment.text}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="no-comments">No comments yet. Be the first!</div>
                      )}
                    </div>
                    
                    <div className="comment-input-row">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Add a comment..."
                        value={commentInputs[item._id] || ""}
                        onChange={(e) => handleCommentInputChange(item._id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(item._id); }}
                      />
                      <button className="comment-submit-btn" onClick={() => handleAddComment(item._id)}>
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box" onClick={(e)=>e.stopPropagation()}>
            <h2>New Snap</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Choose Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e)=>setFile(e.target.files[0])}
                />
              </div>

              <div className="form-group">
                <label>Caption</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e)=>setCaption(e.target.value)}
                  placeholder="Write a caption"
                />
              </div>

              <div className="button-group">
                <button type="submit" disabled={uploading} style={{ backgroundColor: "#007bff" }}>
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <button type="button" onClick={closeForm} style={{ backgroundColor: "#6c757d" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Photos;
