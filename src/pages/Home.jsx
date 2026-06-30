
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";
import "./Home.css";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { FiSend } from "react-icons/fi";
import { RiZzzFill } from "react-icons/ri";
import { io } from "socket.io-client";

const SOCKET_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3000" 
  : "https://rizzchat-be-pejo.onrender.com";

let socket = io(SOCKET_URL);

const EMOJIS = ["👍", "❤️", "😂", "🔥", "💀"];

function Home(){
  let [chat, setChat] = useState([]);
  let [message, setMessage] = useState("");
  let [username, setUsername] = useState(null);
  let [onlineUsers, setOnlineUsers] = useState([]);
  let [typingUsers, setTypingUsers] = useState([]);
  let [showOnlineList, setShowOnlineList] = useState(false);

  let endRef = useRef(null);
  let typingTimeoutRef = useRef(null);

  let auth = getAuth();
  let nav = useNavigate();

  useEffect(()=>{
    function checkUser(user){
      if(!user) nav("/login");      
      else {
        setUsername(user.email);
        socket.emit("registerUser", user.email);
      }
    }

    let stopWatching = onAuthStateChanged(auth, checkUser);
    return ()=> stopWatching();
  } , [] );

  useEffect(() => {
    socket.on("history", (data) => setChat(data));
    socket.emit("getHistory");

    socket.on("message", (data) => setChat((prev) => [...prev, data]));
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    
    socket.on("typing", (user) => {
      setTypingUsers((prev) => prev.includes(user) ? prev : [...prev, user]);
    });

    socket.on("stopTyping", (user) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    });

    socket.on("messageReacted", ({ messageId, reactions }) => {
      setChat((prev) => prev.map((msg) => {
        if (msg._id === messageId) {
          return { ...msg, reactions };
        }
        return msg;
      }));
    });
    
    return () => {
      socket.off("history");
      socket.off("message");
      socket.off("onlineUsers");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageReacted");
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function sendMessage() {
     if(username && message.trim()) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit("stopTyping", username);
        socket.emit("message", { username, message: message.trim() });
        setMessage("");
     }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (username) {
      socket.emit("typing", username);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", username);
      }, 1500);
    }
  };

  const handleReact = (messageId, emoji) => {
    if (!messageId || !username) return;
    socket.emit("reactMessage", { messageId, emoji, username });
  };

  return (
    <div className="container">
      <div className="form-box chat-layout">
        <h2>RizzChat <RiZzzFill /></h2>

        <div className="button-group">
          <button onClick={()=>nav("/profile")} style={{ backgroundColor: "#28a745" }}>
            Profile
          </button>

          <button onClick={()=>nav("/photos")} style={{ backgroundColor: "#007bff" }}>
            Snaps
          </button>

          <button onClick={()=>signOut(auth).then(()=>nav("/login"))} style={{ backgroundColor: "#dc3545" }}>
            Logout
          </button>
        </div>

        {/* Online Status Header */}
        <div className="online-status-bar" onClick={() => setShowOnlineList(!showOnlineList)}>
          <span className="online-indicator-dot"></span>
          <span>{onlineUsers.length} Online</span>
          <span className="expand-arrow">{showOnlineList ? "▲" : "▼"}</span>
        </div>

        {showOnlineList && (
          <div className="online-users-list">
            {onlineUsers.map((userEmail) => (
              <div key={userEmail} className="online-user-item">
                <span className="online-dot-small"></span>
                <span className="user-email-text">{userEmail} {userEmail === username && "(You)"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="chat-box">
          <div className="chat-messages">
            {chat.map((data, index) => (
              <div
                key={data._id || index}
                className={`chat-row ${data.username === username ? "sent" : "received"}`}
              >
                <div className="chat-sender">{data.username}</div>
                
                <div className="chat-bubble-container">
                  <span className={`chat-bubble ${data.username === username ? "sent" : "received"}`}>
                    {data.message}
                  </span>

                  {data._id && (
                    <div className="emoji-reaction-picker">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          className="emoji-picker-btn"
                          onClick={() => handleReact(data._id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Render reactions under message bubble */}
                {data.reactions && Object.keys(data.reactions).length > 0 && (
                  <div className={`reactions-row ${data.username === username ? "sent" : "received"}`}>
                    {Object.entries(data.reactions).map(([emoji, users]) => {
                      let active = users.includes(username);
                      return (
                        <div
                          key={emoji}
                          className={`reaction-pill ${active ? "active" : ""}`}
                          onClick={() => handleReact(data._id, emoji)}
                          title={`Reacted by: ${users.join(", ")}`}
                        >
                          <span>{emoji}</span>
                          <span className="reaction-count">{users.length}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Typing Indicator Panel */}
          {typingUsers.filter((u) => u !== username).length > 0 && (
            <div className="typing-indicator-container">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-text">
                {typingUsers.filter((u) => u !== username).slice(0, 2).join(", ")}
                {typingUsers.filter((u) => u !== username).length > 2 && " and others"}
                {" is typing..."}
              </span>
            </div>
          )}

          <div className="chat-input-area">
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message..."
                value={message}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              />
              <button className="send-btn" onClick={sendMessage}>
                <FiSend style={{ color: 'inherit' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
