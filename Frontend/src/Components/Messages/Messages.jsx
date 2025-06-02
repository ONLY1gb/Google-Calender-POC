import React from 'react';
import ReactMarkdown from 'react-markdown';
import './Messages.css';

const Messages = ({ messages }) => {
  return (
    <div className="messages-container">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
        >
          <div className="message-content">
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Messages;
