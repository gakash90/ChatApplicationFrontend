import React from 'react';

const UserList = ({ users, selectedUser, onlineUsers, onUserSelect }) => {
  return (
    <div className="user-list">
      {users.length === 0 ? (
        <div className="no-users">
          <p>🔍 No other users found</p>
          <small>Other users will appear here when they sign up</small>
        </div>
      ) : (
        users.map(user => (
          <div
            key={user._id}
            onClick={() => onUserSelect(user)}
            className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
          >
            <div className="user-info">
              <div className="avatar-container">
                <div className="avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className={`status-indicator ${onlineUsers[user._id] ? 'online' : 'offline'}`}>
                  {onlineUsers[user._id] ? '🟢' : '⚫'}
                </div>
              </div>
              <div className="user-details">
                <h4 className="username">{user.username}</h4>
                <p className="user-email">{user.email}</p>
                <p className={`status-text ${onlineUsers[user._id] ? 'online' : 'offline'}`}>
                  {onlineUsers[user._id] ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            {selectedUser?._id === user._id && (
              <div className="selected-indicator">💬</div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default UserList;