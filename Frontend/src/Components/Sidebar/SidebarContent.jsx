import React, { useState, useEffect } from 'react';
import { FaCalendarDay, FaUsers } from 'react-icons/fa';
import "./SidebarContent.css"

export const TodaysEvents = ({
  isActive,
  credentials_path,
  user_id = "default_user",
  session_id = "default_session"
}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isActive) {
      setEvents([]);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('limit', 10);
        params.append('user_id', user_id);
        params.append('session_id', session_id);
        params.append('date_from', new Date().toISOString().split('T')[0]);

        if (credentials_path) {
          params.append('credentials_path', encodeURIComponent(credentials_path));
        }

        const url = `http://localhost:8000/calendar/events?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const mappedEvents = data.map(event => ({
          time: event.start?.dateTime
            ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'All Day',
          title: event.summary || 'No Title',
          location: event.location || '',
          hangoutLink: event.hangoutLink || null,
          icon: <FaCalendarDay />
        }));

        setEvents(mappedEvents);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isActive, credentials_path, user_id, session_id]);

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="sidebar-section">
        <h3>Today's Events</h3>
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sidebar-section">
        <h3>Today's Events</h3>
        <p>Error loading events: {error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="sidebar-section">
        <h3>Today's Events</h3>
        <p>No events for today.</p>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <h3>Today's Events</h3>
      <ul className="event-list">
        {events.slice(0,3).map((event, index) => (
          <li key={index} className="event-item">
            <span className="event-time">{event.time}</span>
            <span className="event-icon">{event.icon}</span>
            <span className="event-title">{event.title}</span>
            <span className="event-location">{event.location}</span>
            {event.hangoutLink && (
              <button
                className="join-button"
                onClick={() => window.open(event.hangoutLink, '_blank')}
                style={{ marginLeft: '8px', padding: '2px 8px', cursor: 'pointer'}}
              >
                Join
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="event-summary">
        You have {events.length} events today. Stay productive and manage your time well!
      </p>
    </div>
  );
};

export const UpcomingEvents = () => {
  const upcoming = [
    {
      day: 'Tomorrow',
      events: [
        { time: '10:00 AM', title: 'Marketing Meeting' },
        { time: '3:00 PM', title: 'Design Review' },
      ],
    },
    {
      day: 'Next Week',
      events: [
        { time: 'Monday 9:00 AM', title: 'Sprint Planning' },
        { time: 'Friday 1:00 PM', title: 'Client Presentation' },
      ],
    },
  ];

  return (
    <div className="sidebar-section">
      <h3>Upcoming Events</h3>
      {upcoming.map((group, idx) => (
        <div key={idx} className="upcoming-group">
          <h4>{group.day}</h4>
          <ul className="event-list">
            {group.events.map((event, i) => (
              <li key={i} className="event-item">
                <span className="event-time">{event.time}</span>
                <span className="event-title">{event.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export const TeamCalendar = () => {
  const teamEvents = [
    { member: 'Alice', status: 'Available', nextEvent: 'Team Sync at 3 PM', icon: <FaUsers /> },
    { member: 'Bob', status: 'In Meeting', nextEvent: 'Project Review at 4 PM', icon: <FaUsers /> },
    { member: 'Charlie', status: 'Out of Office', nextEvent: 'Back on Monday', icon: <FaUsers /> },
  ];

  return (
    <div className="sidebar-section">
      <h3>Team Calendar</h3>
      <ul className="team-list">
        {teamEvents.map((member, index) => (
          <li key={index} className="team-member">
            <span className="team-icon">{member.icon}</span>
            <span className="team-name">{member.member}</span>
            <span className={`team-status ${member.status.replace(/\s+/g, '-').toLowerCase()}`}>{member.status}</span>
            <span className="team-next-event">{member.nextEvent}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
