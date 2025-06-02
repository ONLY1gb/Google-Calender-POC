import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { TodaysEvents, UpcomingEvents, TeamCalendar } from './SidebarContent';
import './SidebarContentDisplay.css';

const SidebarContentDisplay = ({ activeTab, visible, onClose, credentials_path, user_id, session_id }) => {
  if (!visible) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Todays Events':
        return <TodaysEvents isActive={true} credentials_path={credentials_path} user_id={user_id} session_id={session_id} />;
      case 'Upcoming':
        return <UpcomingEvents />;
      case 'Team Calendar':
        return <TeamCalendar />;
      default:
        return null;
    }
  };

  return (
    <div className="content-display-overlay">
      <div className="content-display-box">
        <button className="close-button" onClick={onClose} aria-label="Close">
          <FaTimes size={20} />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default SidebarContentDisplay;
