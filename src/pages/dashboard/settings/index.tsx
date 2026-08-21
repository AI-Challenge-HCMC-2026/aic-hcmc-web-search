import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { getStoredSettings, saveStoredSettings } from '../../../services/settings';
import './index.css';

export const SettingsPage: React.FC = () => {
  const initial = getStoredSettings();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [selectedModel, setSelectedModel] = useState(initial.model);
  const [enableReasoning, setEnableReasoning] = useState(initial.enableReasoning);
  const [enableMcp, setEnableMcp] = useState(initial.enableMcp);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const modelOptions: SelectOption[] = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Khuyên dùng' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
    { value: 'gemini-3.0-flash', label: 'Gemini 3.0 Flash' },
    { value: 'gemini-3.0-pro', label: 'Gemini 3.0 Pro', badge: 'Mạnh mẽ' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setShowSavedToast(false);

    saveStoredSettings({
      apiKey,
      model: selectedModel,
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

  return (
    <div className="settings-container">
      {/* Page Header */}
      <header className="settings-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent-terracotta)', fontSize: '20px' }}>✻</span>
          <h1 className="settings-title">Cài đặt</h1>
        </div>
        <p className="settings-subtitle">Quản lý API key, mô hình và tích hợp MCP.</p>
      </header>

      {/* Section 1: API & Mô hình */}
      <section className="settings-card" aria-labelledby="api-model-title">
        <div className="settings-card-header">
          <h2 id="api-model-title" className="settings-card-title">API & Mô hình</h2>
          <p className="settings-card-desc">Kết nối tới Google Gemini.</p>
        </div>

        <div className="settings-group">
          {/* API Key Input */}
          <Input
            label="Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            isPasswordToggleable
            statusBadge={
              <>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Đã lưu API key</span>
              </>
            }
            helperText={
              <span>
                Lấy key tại{' '}
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

          {/* Model Selection Dropdown */}
          <Select
            label="Mô hình AI"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            options={modelOptions}
            helperText="Chọn mô hình phù hợp với nhu cầu suy luận và chi phí."
          />

          <div className="settings-divider" />

          {/* Reasoning Switch */}
          <Switch
            label="Hiển thị suy luận"
            checked={enableReasoning}
            onChange={setEnableReasoning}
            description={
              enableReasoning
                ? 'Đang bật — hiển thị các bước suy luận của mô hình.'
                : 'Đang tắt — chỉ hiển thị kết quả cuối cùng.'
            }
          />
        </div>
      </section>

      {/* Section 2: MCP Tools */}
      <section className="settings-card" aria-labelledby="mcp-title">
        <div className="settings-card-header">
          <h2 id="mcp-title" className="settings-card-title">MCP Tools</h2>
          <p className="settings-card-desc">Kết nối công cụ tra cứu nội bộ.</p>
        </div>

        <div className="settings-group">
          {/* MCP Toggle Switch */}
          <Switch
            label="Bật MCP Tools"
            checked={enableMcp}
            onChange={setEnableMcp}
            description={
              enableMcp
                ? 'Đang bật — mô hình có thể gọi công cụ MCP.'
                : 'Đang tắt — không thể truy vấn công cụ nội bộ.'
            }
          />
        </div>
      </section>

      {/* Action Buttons & Toast */}
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
