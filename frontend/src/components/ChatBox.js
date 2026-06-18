import React, { useState, useEffect, useRef, useContext } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ChatBox = ({ complaintId }) => {
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 1. Fetch message history via HTTP
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/${complaintId}`);
        setMessages(res.data.data);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchHistory();

    // 2. Establish Socket connection
    const newSocket = io('http://localhost:5000', {
      query: { token },
    });

    setSocket(newSocket);

    // Join room
    newSocket.emit('joinRoom', { complaintId });

    // Listen for new messages
    newSocket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [complaintId, token]);

  // Scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    // Send via socket
    socket.emit('sendMessage', { complaintId, text });
    setText('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3 style={{ fontSize: '1.1rem' }}>💬 Support Chat Room</h3>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Real-time Link Active</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <p style={{ fontSize: '0.9rem' }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
            return (
              <div
                key={index}
                className={`chat-bubble ${isMe ? 'sent' : 'received'}`}
              >
                {!isMe && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.2rem', color: msg.sender?.role === 'AGENT' ? '#38bdf8' : '#cbd5e1' }}>
                    {msg.sender?.name} ({msg.sender?.role})
                  </div>
                )}
                <div>{msg.text}</div>
                <div className="chat-meta">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <input
          type="text"
          className="form-control chat-input"
          placeholder="Type your message here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
