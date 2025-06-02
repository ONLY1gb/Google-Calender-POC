import React, { useState } from 'react';
import { FaRegCalendarAlt, FaRegClock, FaUsers } from 'react-icons/fa';
import './Sidebar.css';
import SidebarContentDisplay from './SidebarContentDisplay';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [contentVisible, setContentVisible] = useState(false);

  // Add credentials_path, user_id, session_id here
  const credentials_path = "C:/Users/ASUS/Desktop/GoogleCalender/Backend/client_secret_169866189853-nihilfhtmj6u0mtfouutlagq1egca1d0.apps.googleusercontent.com.json"; // Replace with actual path or config
  const user_id = "default_user";
  const session_id = "default_session";

  const recentChats = [
    { id: 1, title: 'Todays Events', icon: <FaRegCalendarAlt /> },
    { id: 2, title: 'Upcoming', icon: <FaRegClock /> },
    { id: 3, title: 'Team Calendar', icon: <FaUsers /> },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleTabClick = (title) => {
    if (activeTab === title && contentVisible) {
      setContentVisible(false);
      setActiveTab(null);
    } else {
      setActiveTab(title);
      setContentVisible(true);
    }
  };

  const handleCloseContent = () => {
    setContentVisible(false);
    setActiveTab(null);
  };

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && <h2 className="sidebar-title">Calendar AI</h2>}
          <button 
            className="toggle-button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="toggle-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
              />
            </svg>
          </button>
        </div>
        
        {isCollapsed ? (
          <div className="chat-list-collapsed">
            {recentChats.map((chat) => (
              <div 
                key={chat.id} 
                className="chat-item-collapsed" 
                style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem', marginBottom: '0.5rem', cursor: 'pointer' }}
                onClick={() => handleTabClick(chat.title)}
              >
                <span className="chat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color:"#040c44" }}>{chat.icon}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-list">
            {recentChats.map((chat) => (
              <div 
                key={chat.id} 
                className={`chat-item ${activeTab === chat.title && contentVisible ? 'active' : ''}`}
                onClick={() => handleTabClick(chat.title)}
              >
                <span className="chat-icon" style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>{chat.icon}</span>
                <span className="chat-title">{chat.title}</span>
                <span className="chat-time">{chat.time}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-footer">
          {isCollapsed ? (
            <img src="/src/assets/icon.png" alt="Genaiprotos Icon" className="genaiprotos-icon" />
          ) : (
            <div className="genaiprotos-full d-flex justify-content-center align-items-center gap-2">
              <a href="https://www.genaiprotos.com/" target='blank'> <img src="/src/assets/icon.png" alt="Genaiprotos Icon" className="genaiprotos-icon" /></a>
             <a href="https://www.genaiprotos.com/" target='blank'> <img src="/src/assets/logo.png" alt="Genaiprotos Logo" className="genaiprotos-text" /></a>
            </div>
          )}
        </div>
      </div>
      <SidebarContentDisplay 
        activeTab={activeTab} 
        visible={contentVisible} 
        onClose={handleCloseContent} 
        credentials_path={credentials_path}
        user_id={user_id}
        session_id={session_id}
      />
    </>
  );
};

export default Sidebar;
