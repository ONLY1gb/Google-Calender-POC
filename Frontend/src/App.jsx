import React, { useState } from 'react'
import "./App.css"
import Sidebar from './Components/Sidebar/Sidebar'
import Header from './Components/Header/Header'
import MainContent from './Components/MainContent/MainContent'
import InputSection from './Components/InputSection/InputSection'
import Messages from './Components/Messages/Messages'
import UploadModal from './Components/UploadModal/UploadModal'
import "bootstrap/dist/css/bootstrap.min.css"

const App = () => {
  const [messages, setMessages] = useState([])
  const [chatActive, setChatActive] = useState(false)
  const [message, setMessage] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [allowedFileTypes, setAllowedFileTypes] = useState('*')
  const [uploadedFile, setUploadedFile] = useState(null)

  // Fixed user_id and session_id for demo purposes
  const userId = "user123"
  const sessionId = "session123"

  const handleSendMessage = async () => {
    if (message.trim() === '') return

    // Add user message to chat
    setMessages(prev => [...prev, { text: message, sender: 'user' }])
    setMessage('')
    setChatActive(true)

    try {
      // Prepare request payload
      const payload = {
        user_query: message,
        user_id: userId,
        session_id: sessionId,
        credentials_path: null
      }

      // Call /chat endpoint with full backend URL and streaming response
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Read streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let agentMessage = ''

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          agentMessage += decoder.decode(value, { stream: true })
          // Update messages with partial agent message
          setMessages(prev => {
            // Remove previous partial agent message if any
            const filtered = prev.filter(m => m.sender !== 'agent-partial')
            return [...filtered, { text: agentMessage, sender: 'agent-partial' }]
          })
        }
      }

      // Replace partial message with final agent message
      setMessages(prev => {
        const filtered = prev.filter(m => m.sender !== 'agent-partial')
        return [...filtered, { text: agentMessage, sender: 'agent' }]
      })

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { text: 'Error: Could not get response from server.', sender: 'agent' }])
    }
  }

  const handleOpenUploadModal = (fileTypes) => {
    setAllowedFileTypes(fileTypes)
    setShowUploadModal(true)
  }

  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
  }

  const handleUploadSuccess = (file) => {
    setUploadedFile(file)
    setShowUploadModal(false)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
     <Sidebar/>
     <div style={{ flex: 1, display: 'flex', flexDirection: 'column',}}>
       {!chatActive && <>
         <Header/>
         <MainContent/>
       </>}
       {chatActive && <Messages messages={messages} />}
       <InputSection
         message={message}
         setMessage={setMessage}
         onSendMessage={handleSendMessage}
         onAttachmentClick={() => handleOpenUploadModal('*')}
         onCalendarClick={() => handleOpenUploadModal('.json')}
         uploadedFile={uploadedFile}
         onRemoveFile={handleRemoveFile}
         
       />
       {showUploadModal && <UploadModal onClose={handleCloseUploadModal} allowedFileTypes={allowedFileTypes} onUploadSuccess={handleUploadSuccess} />}
     </div>
    </div>
  )
}

export default App
