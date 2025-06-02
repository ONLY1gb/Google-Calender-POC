import React from 'react';
import { FaCalendarPlus, FaRegCalendarAlt, FaLightbulb } from 'react-icons/fa';
import './MainContent.css';

const MainContent = () => {
  return (
    <main className="main-content">
      <div className="card-container">
        <div className="card card-1" style={{borderRadius:"30px"}}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <FaCalendarPlus size={36} style={{ marginRight: '10px', color: '#7c3aed' }} />
            <h3 style={{ margin: 0 }}>Create Events</h3>
          </div>
          <p>Easily add new events to your calendar using AI assistance.</p>
        </div>
        <div className="card card-2" style={{borderRadius:"30px"}}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', }}>
            <FaRegCalendarAlt size={36} style={{ marginRight: '10px', color: '#2563eb' }} />
            <h3 style={{ margin: 0 }}>View Schedule</h3>
          </div>
          <p>Quickly check your upcoming events and appointments.</p>
        </div>
        <div className="card card-3" style={{borderRadius:"30px"}}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <FaLightbulb size={36} style={{ marginRight: '10px', color: '#ec4899' }} />
            <h3 style={{ margin: 0 }}>Get Suggestions</h3>
          </div>
          <p>Receive intelligent suggestions to optimize your schedule.</p>
        </div>
      </div>
    </main>
  );
};

export default MainContent;

