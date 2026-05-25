import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';

const ChatBox = () => {
  const { user } = useContext(AuthContext);
  const { gameState } = useGame();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages((prev) => [...prev, data]);
      
      // If chat is closed, increment unread count
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket, isOpen]);

  // Auto-scroll to bottom only when drawer is open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    // Clear unread count when opening
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() === '' || !gameState) return;

    socket.emit('send-chat-message', {
      roomCode: gameState.roomCode,
      loginname: user.loginname,
      displayname: user.displayname,
      message: currentMessage.trim()
    });

    setCurrentMessage('');
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button className="chat-fab" onClick={toggleChat}>
        💬
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Drawer */}
      <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
        <div className="chat-drawer-header">
          <h3>Game Chat</h3>
          <button className="chat-close-btn" onClick={toggleChat}>✕</button>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 && <p className="chat-empty">No messages yet...</p>}
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.displayname === user.displayname ? 'my-message' : ''}`}>
              <span className="chat-timestamp">{msg.timestamp}</span>
              <strong className="chat-name">{msg.displayname}: </strong>
              <span className="chat-text">{msg.message}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-input-form">
          <input 
            type="text" 
            value={currentMessage} 
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button type="submit" className="chat-send-btn">Send</button>
        </form>
      </div>
    </>
  );
};

export default ChatBox;