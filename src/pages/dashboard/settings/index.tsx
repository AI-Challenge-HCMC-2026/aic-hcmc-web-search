import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import {
  getStoredSettings,
  saveStoredSettings,
  GEMINI_AVAILABLE_MODELS,
} from '../../../services/settings';
import './index.css';

export const SettingsPage: React.FC = () => {
  const initial = getStoredSettings();

  // Backend API Base URL state (purely user-provided)
  const [backendBaseUrl, setBackendBaseUrl] = useState(initial.backendBaseUrl);

  // Gemini section states
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [selectedModel, setSelectedModel] = useState(initial.model);

  // Custom Models section states
  const [customBaseUrl, setCustomBaseUrl] = useState(initial.customBaseUrl);
  const [customApiKey, setCustomApiKey] = useState(initial.customApiKey);
  const [customModel, setCustomModel] = useState(initial.customModel);

  // General toggles
  const [enableReasoning, setEnableReasoning] = useState(initial.enableReasoning);
  const [enableMcp, setEnableMcp] = useState(initial.enableMcp);

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Restricted Gemini model options: Only gemini-3.1-flash-lite and gemini-3.5-flash-lite
  const geminiOptions: SelectOption[] = [...GEMINI_AVAILABLE_MODELS];

  const handleSave = () => {
    setIsSaving(true);
    setShowSavedToast(false);

    saveStoredSettings({
      backendBaseUrl,
      apiKey,
      model: selectedModel,
      customBaseUrl,
      customApiKey,
      customModel,
      enableReasoning,
      enableMcp,
    });

    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);

      setTimeout(() => {
        setShowSavedToast(false);
      }, 3500);
    }, 400);
  };

  const isBackendConfigured = backendBaseUrl.trim().length > 0;

  return (
    <div className="settings-container">
      {/* Page Header */}
      <header className="settings-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent-terracotta)', fontSize: '20px' }}>✻</span>
          <h1 className="settings-title">Cài đặt</h1>
        </div>
        <p className="settings-subtitle">Cấu hình địa chỉ máy chủ API backend, Google Gemini và Custom Models.</p>
      </header>

      {/* ─── SECTION 1: Backend API Service ─── */}
      <section className="settings-card" aria-labelledby="backend-api-title">
        <div className="settings-card-header">
          <h2 id="backend-api-title" className="settings-card-title">1. Backend API Service (Bắt buộc)</h2>
          <p className="settings-card-desc">Địa chỉ máy chủ API backend phục vụ tải dữ liệu (Dataset, Keyframes) và các tác vụ tìm kiếm.</p>
        </div>

        <div className="settings-group">
          {/* Warning banner when Backend Base URL is not filled */}
          {!isBackendConfigured && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: 'rgba(218, 119, 86, 0.12)',
                border: '1px solid rgba(218, 119, 86, 0.35)',
                borderRadius: 'var(--radius-sm, 8px)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: '1.45',
              }}
              role="alert"
            >
              <span style={{ color: 'var(--accent-terracotta)', fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>
                ⚠️
              </span>
              <div>
                <strong style={{ color: 'var(--accent-terracotta)', display: 'block', marginBottom: '2px' }}>
                  Chưa cấu hình Backend Base URL
                </strong>
                Bạn cần nhập địa chỉ API máy chủ backend vào ô bên dưới và nhấn <strong>Lưu cấu hình</strong> để hệ thống có thể kết nối và tải dữ liệu.
              </div>
            </div>
          )}

          <Input
            label="Backend Base URL"
            value={backendBaseUrl}
            onChange={(e) => setBackendBaseUrl(e.target.value)}
            placeholder="http://127.0.0.1:8000/api/v1 hoặc https://your-tunnel.ngrok-free.app/api/v1"
            error={!isBackendConfigured ? 'Vui lòng nhập Backend Base URL để hệ thống hoạt động.' : undefined}
            statusBadge={
              isBackendConfigured ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Đang sử dụng</span>
                </>
              ) : undefined
            }
            helperText="Địa chỉ gốc của API backend. Hệ thống chỉ lấy URL từ cài đặt này và không tự động fallback."
          />
        </div>
      </section>

      {/* ─── SECTION 2: Cài đặt Google Gemini ─── */}
      <section className="settings-card" aria-labelledby="gemini-settings-title">
        <div className="settings-card-header">
          <h2 id="gemini-settings-title" className="settings-card-title">2. Google Gemini</h2>
          <p className="settings-card-desc">Cấu hình kết nối trực tiếp với Google Gemini AI Studio.</p>
        </div>

        <div className="settings-group">
          {/* Gemini API Key */}
          <Input
            label="Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Nhập khóa API Google Gemini..."
            isPasswordToggleable
            statusBadge={
              apiKey.trim() ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Đã có key</span>
                </>
              ) : undefined
            }
            helperText={
              <span>
                Lấy API key tại{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-terracotta)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Google AI Studio &rarr;
                </a>
              </span>
            }
          />

          {/* Gemini Model Selection Dropdown (Only 3.1 Flash Lite & 3.5 Flash Lite) */}
          <Select
            label="Mô hình Gemini"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            options={geminiOptions}
            helperText="Danh sách mô hình Gemini (Gemini 3.1 Flash Lite và Gemini 3.5 Flash Lite)."
          />
        </div>
      </section>

      {/* ─── SECTION 3: Cài đặt Custom Models ─── */}
      <section className="settings-card" aria-labelledby="custom-models-title">
        <div className="settings-card-header">
          <h2 id="custom-models-title" className="settings-card-title">3. Custom Models</h2>
          <p className="settings-card-desc">Cấu hình endpoint tùy chỉnh hoặc API tương thích OpenAI (Ollama, vLLM, DeepSeek, OpenRouter...).</p>
        </div>

        <div className="settings-group">
          {/* Field 1: Base URL */}
          <Input
            label="Base URL"
            value={customBaseUrl}
            onChange={(e) => setCustomBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1 hoặc http://localhost:11434/v1"
            helperText="Địa chỉ gốc của endpoint API (ví dụ: https://api.openai.com/v1 hoặc proxy nội bộ)."
          />

          {/* Field 2: API Key */}
          <Input
            label="API Key"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="sk-..."
            isPasswordToggleable
            helperText="Khóa xác thực API của nhà cung cấp tùy chỉnh."
          />

          {/* Field 3: Model Name / ID */}
          <Input
            label="Model"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="gpt-4o, deepseek-chat, qwen-2.5-72b..."
            helperText="Tên định danh mô hình trên endpoint (ví dụ: gpt-4o, deepseek-chat, llama-3.3-70b)."
          />
        </div>
      </section>

      {/* ─── SECTION 4: Cấu hình Hệ thống & MCP ─── */}
      <section className="settings-card" aria-labelledby="system-settings-title">
        <div className="settings-card-header">
          <h2 id="system-settings-title" className="settings-card-title">4. Tùy chọn hệ thống & MCP</h2>
          <p className="settings-card-desc">Cấu hình hiển thị suy luận và quyền gọi công cụ nội bộ.</p>
        </div>

        <div className="settings-group">
          {/* Reasoning Switch */}
          <Switch
            label="Hiển thị suy luận"
            checked={enableReasoning}
            onChange={setEnableReasoning}
            description={
              enableReasoning
                ? 'Đang bật — hiển thị các bước suy luận phân tích của mô hình.'
                : 'Đang tắt — chỉ hiển thị kết quả truy vấn cuối cùng.'
            }
          />

          <div className="settings-divider" />

          {/* MCP Toggle Switch */}
          <Switch
            label="Bật MCP Tools"
            checked={enableMcp}
            onChange={setEnableMcp}
            description={
              enableMcp
                ? 'Đang bật — mô hình có thể kích hoạt các công cụ tra cứu MCP nội bộ.'
                : 'Đang tắt — không cho phép gọi công cụ MCP.'
            }
          />
        </div>
      </section>

      {/* ─── Action Buttons & Toast ─── */}
      <div className="settings-actions">
        {showSavedToast && (
          <div className="toast-saved" role="status">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Đã lưu cấu hình thành công!</span>
          </div>
        )}

        <Button
          variant="primary"
          size="md"
          isLoading={isSaving}
          onClick={handleSave}
        >
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
