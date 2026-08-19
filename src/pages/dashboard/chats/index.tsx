import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

const quickChips = [
  { icon: '</>', label: 'Code', prompt: 'Viết hàm trích xuất dữ liệu từ API và xử lý lỗi...' },
  { icon: '✏️', label: 'Write', prompt: 'Soạn thảo tài liệu đặc tả kiến trúc hệ thống MCP...' },
  { icon: '📈', label: 'Strategize', prompt: 'Lập kế hoạch tối ưu hóa hiệu năng tìm kiếm...' },
  { icon: '🔍', label: 'Search', prompt: 'Tra cứu thông tin mới nhất về Google Gemini 3.1...' },
];

export const ChatsPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Xin chào Phú Nguyễn! Tôi là MIBR AI Assistant. Tôi có thể hỗ trợ bạn tra cứu tài liệu, phân tích mã nguồn hoặc kết nối các công cụ MCP. Bạn cần hỗ trợ gì hôm nay?',
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query) return;

    const userMsg: Message = { sender: 'user', text: query, timestamp: 'Vừa xong' };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Đã nhận yêu cầu: "${query}". Đang thực hiện kết nối MCP và xử lý suy luận...`,
          timestamp: 'Vừa xong',
        },
      ]);
    }, 700);
  };

  const handleChipClick = (prompt: string) => {
    handleSend(prompt);
  };

  const handleNewChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Bắt đầu cuộc trò chuyện mới. Hãy nhập câu hỏi hoặc chọn một tác vụ gợi ý bên dưới.',
        timestamp: 'Vừa xong',
      },
    ]);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: '840px',
        margin: '0 auto',
        padding: '32px 24px 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── Header ─── */}
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-terracotta)', fontSize: '20px' }}>✻</span>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '24px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
              }}
            >
              Chats
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Trò chuyện với mô hình AI và công cụ tra cứu tích hợp.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={handleNewChat}>
          + Cuộc trò chuyện mới
        </Button>
      </div>

      {/* ─── Quick Action Chips ─── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(chip.prompt)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-focus)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          >
            <span style={{ fontSize: '12px' }}>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Message List Area ─── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px',
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg, 16px)',
          minHeight: '300px',
        }}
      >
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-terracotta)',
                    fontSize: '14px',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                    marginTop: '2px',
                  }}
                >
                  ✻
                </div>
              )}

              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 18px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: isUser ? 'var(--accent-terracotta)' : 'var(--bg-surface-elevated)',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  fontSize: '13.5px',
                  lineHeight: 1.55,
                  boxShadow: 'var(--shadow-btn)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface-active)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-terracotta)',
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              ✻
            </div>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '16px 16px 16px 4px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
              }}
            >
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-terracotta)', borderRadius: '50%', animation: 'spin 1s infinite' }} />
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-tertiary)', borderRadius: '50%', animation: 'spin 1s infinite 0.2s' }} />
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animation: 'spin 1s infinite 0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Claude-style Warm Input Box ─── */}
      <div
        style={{
          marginTop: '14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface-subtle)',
          border: isInputFocused ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '6px 8px 6px 16px',
          boxShadow: isInputFocused ? '0 0 0 3px var(--accent-terracotta-subtle)' : 'none',
          transition: 'all 0.18s ease',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          placeholder="Nhập tin nhắn cho MIBR AI..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          style={{
            flex: 1,
            height: '38px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
        />

        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSend()}
          style={{
            borderRadius: 'var(--radius-md, 12px)',
            height: '36px',
            padding: '0 16px',
          }}
        >
          Gửi
        </Button>
      </div>
    </div>
  );
};

export default ChatsPage;
