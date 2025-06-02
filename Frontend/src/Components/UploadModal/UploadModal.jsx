import React, { useState } from 'react';
import './UploadModal.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadModal = ({ onClose, allowedFileTypes = '.csv', validateFile, onUploadSuccess }) => {
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);

  const defaultValidateFile = (selectedFile) => {
    if (allowedFileTypes === '*') {
      return true;
    }
    const allowedExtensions = allowedFileTypes.split(',').map(ext => ext.trim().toLowerCase());
    return allowedExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const isValid = validateFile ? validateFile(selectedFile) : defaultValidateFile(selectedFile);
    if (selectedFile && isValid) {
      setFileName(selectedFile.name);
      setFile(selectedFile);
    } else {
      setFileName('');
      setFile(null);
      toast.error(`Please upload a file of type: ${allowedFileTypes}`);
      e.target.value = null; // Reset the input
    }
  };

  const handleUploadClick = async () => {
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Upload failed');
        }

        const data = await response.json();
        toast.success(`File uploaded successfully: ${data.filename}`);

        if (onUploadSuccess) {
          onUploadSuccess(file);
        }

        // After upload, reset file and fileName
        setFileName('');
        setFile(null);
        onClose();
      } catch (error) {
        toast.error(`Upload error: ${error.message}`);
      }
    }
  };

  return (
    <div className="upload-modal-overlay">
      <div className="upload-modal-content">
        <div className="upload-modal-header">
          <h3>Upload Calendar File</h3>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>
        <div className="upload-modal-body">
          <i className="fas fa-cloud-upload-alt icon"></i>
          {!fileName && (
            <>
              <p>Drag and drop your calendar file here or</p>
              <label className="browse-btn">
                Browse Files
                <input
                  type="file"
                  className="hidden-file"
                  accept={allowedFileTypes}
                  onChange={handleFileChange}
                />
              </label>
              <p className="support-text">Supports {allowedFileTypes} files only</p>
            </>
          )}
          {fileName && <p className="file-name">Selected file: {fileName}</p>}
          {fileName && (
            <button className="upload-btn" onClick={handleUploadClick}>
              Upload
            </button>
          )}
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default UploadModal;
