import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import UserList from './UserList';

const ChatApp = ({ currentUser, token, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const socketConnection = io('https://chatapplicationbackend-mtt4.onrender.com', {
      transports: ['websocket']
    });
    
    setSocket(socketConnection);

    // Socket connection handlers
    socketConnection.on('connect', () => {
      console.log('Connected to server');
      socketConnection.emit('userConnected', currentUser._id);
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Socket event listeners
    socketConnection.on('receiveMessage', ({ sender, message }) => {
      setMessages(prev => [...prev, {
        sender,
        receiver: currentUser._id,
        message,
        createdAt: new Date()
      }]);
    });

    socketConnection.on('updateUserStatus', ({ userId, isOnline }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: isOnline
      }));
    });

    socketConnection.on('typing', ({ sender }) => {
      setTypingUsers(prev => ({
        ...prev,
        [sender]: true
      }));

      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [sender]: false
        }));
      }, 3000);
    });

    // Fetch users on component mount
    fetchUsers();

    return () => {
      socketConnection.disconnect();
    };
  }, [currentUser._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://chatapplicationbackend-mtt4.onrender.com/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
        setError('');
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(
        `https://chatapplicationbackend-mtt4.onrender.com/api/messages?senderId=${currentUser._id}&receiverId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const messageData = await response.json();
        setMessages(messageData);
      } else {
        throw new Error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Send to backend
      const response = await fetch('https://chatapplicationbackend-mtt4.onrender.com/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sender: currentUser._id,
          receiver: selectedUser._id,
          message: messageText
        })
      });

      if (response.ok) {
        // Send via socket
        socket.emit('sendMessage', {
          sender: currentUser._id,
          receiver: selectedUser._id,
          message: messageText
        });

        // Add to local messages
        setMessages(prev => [...prev, {
          sender: currentUser._id,
          receiver: selectedUser._id,
          message: messageText,
          createdAt: new Date()
        }]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message on error
    }
  };

  const handleTyping = () => {
    if (selectedUser && socket) {
      socket.emit('typing', {
        receiver: selectedUser._id,
        sender: currentUser._id
      });
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setMessages([]);
    fetchMessages(user._id);
    setError('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="current-user-avatar">
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="current-user-info">
              <h3 className="current-username">{currentUser?.username}</h3>
              <p className="current-status">Online</p>
            </div>
          </div>
          <button onClick={onLogout} className="logout-button">
            🚪 Logout
          </button>
        </div>

        {/* User List */}
        <div className="user-list-container">
          <h4 className="user-list-title">💬 Active Users</h4>
          {loading ? (
            <div className="loading-users">Loading users...</div>
          ) : error && users.length === 0 ? (
            <div className="error-users">
              <p>Failed to load users</p>
              <button onClick={fetchUsers} className="retry-button">
                🔄 Retry
              </button>
            </div>
          ) : (
            <UserList 
              users={users}
              selectedUser={selectedUser}
              onlineUsers={onlineUsers}
              onUserSelect={handleUserSelect}
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="chat-avatar">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="chat-user-details">
                  <h3 className="chat-username">{selectedUser.username}</h3>
                  <p className={`chat-status ${onlineUsers[selectedUser._id] ? 'online' : 'offline'}`}>
                    {onlineUsers[selectedUser._id] ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="chat-error">
                <span className="error-icon">⚠️</span>
                {error}
                <button onClick={() => setError('')} className="close-error">×</button>
              </div>
            )}

            {/* Messages */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <div className="no-messages-icon">💬</div>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.sender === currentUser._id ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">
                      <p className="message-text">{message.message}</p>
                      <p className="message-time">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {typingUsers[selectedUser._id] && (
                <div className="message received">
                  <div className="message-bubble typing">
                    <p className="typing-text">
                      <span className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                      {selectedUser.username} is typing...
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <div className="message-input-wrapper">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Type a message to ${selectedUser.username}...`}
                  className="message-input"
                  maxLength="1000"
                />
                <button 
                  onClick={sendMessage} 
                  className="send-button"
                  disabled={!newMessage.trim()}
                >
                  <span className="send-icon">📤</span>
                  Send
                </button>
              </div>
              <div className="input-footer">
                <small>Press Enter to send • Shift+Enter for new line</small>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-chat-content">
              <div className="empty-chat-icon">💭</div>
              <h3 className="empty-chat-title">Welcome to Chat App!</h3>
              <p className="empty-chat-text">
                Select a user from the sidebar to start chatting
              </p>
              <div className="empty-chat-features">
                <div className="feature">✨ Real-time messaging</div>
                <div className="feature">🔔 Typing indicators</div>
                <div className="feature">🟢 Online status</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;