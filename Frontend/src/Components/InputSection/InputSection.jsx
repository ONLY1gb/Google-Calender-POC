import React from 'react';
import './InputSection.css';
import { FaRegCalendarDays } from "react-icons/fa6";

import { HiOutlinePaperClip, HiOutlinePaperAirplane } from 'react-icons/hi';
import { FaArrowUp } from "react-icons/fa";


const InputSection = ({ message, setMessage, onAttachmentClick, onSendMessage, onCalendarClick, uploadedFile, onRemoveFile }) => {
  const handleSendClick = () => {
    if (message.trim() === '') return;
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="input-section">
      <div className="input-wrapper" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '5px' }}>
        {uploadedFile && (
          <div className="uploaded-file-display" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', backgroundColor: '#837af0', padding: '5px 10px', borderRadius: '12px', maxWidth: '150px' }}>
            <span style={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uploadedFile.name}</span>
            <button onClick={onRemoveFile} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', fontSize: '16px', fontWeight: 'bold', color: '#888' }} aria-label="Remove uploaded file">&times;</button>
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendClick();
            }
          }}
          placeholder="Ask about your schedule or create an event..."
          className="message-input"
          style={{ borderRadius: '15px', padding: '20px', resize: 'vertical', minHeight: '80px' }}
        />
        <div className="input-icons" style={{ position: 'static', marginTop: '10px', justifyContent: 'flex-start', gap: '15px' }}>
          <button onClick={onCalendarClick} className="icon-button">
            <FaRegCalendarDays size={20} style={{color:"Green"}}/>
          </button>
          <button onClick={onAttachmentClick} className="icon-button">
            <HiOutlinePaperClip size={20} />
          </button>
          <button onClick={handleSendClick} className="send-button" style={{ marginLeft: 'auto' }}>
            {/* <HiOutlinePaperAirplane size={28} /> */}
            <FaArrowUp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
