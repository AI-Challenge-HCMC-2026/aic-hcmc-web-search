import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import './index.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000/api/v1';

export interface VocabularyItem {
  class_name: string;
  class_entity: string;
}

export interface KeyframeItem {
  keyframe_id: number;
  video_id: string;
  keyframe_name: string;
  frame_idx?: number | null;
  timestamp_sec?: number | null;
  image_path: string;
  public_url?: string | null;
}

export interface MultiObjectSearchResponse {
  total: number;
  limit: number;
  offset: number;
  items: KeyframeItem[];
}

const POPULAR_OBJECTS = [
  'Person',
  'Car',
  'Bicycle',
  'Bus',
  'Traffic light',
  'Land vehicle',
  'Backpack',
  'Tree',
  'Building',
  'Ambulance',
  'Chair',
  'Boat',
];

const formatCount = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const formatTimestamp = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '—';
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${(wholeSeconds % 60).toString().padStart(2, '0')}`;
};

export const ObjectsSearchPage: React.FC = () => {
  // Selected object tags
  const [selectedObjects, setSelectedObjects] = useState<string[]>(['Car']);
  const [threshold, setThreshold] = useState<number>(0.5);
  const [limit, setLimit] = useState<number>(24);
  const [offset, setOffset] = useState<number>(0);

  // Vocabulary search / autocomplete state
  const [inputValue, setInputValue] = useState<string>('');
  const [vocabSuggestions, setVocabSuggestions] = useState<VocabularyItem[]>([]);
  const [isVocabLoading, setIsVocabLoading] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedVocabIndex, setSelectedVocabIndex] = useState<number>(-1);

  // Search execution state
  const [searchResults, setSearchResults] = useState<MultiObjectSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeSearchMeta, setActiveSearchMeta] = useState<{
    objects: string[];
    threshold: number;
    total: number;
  } | null>(null);

  // Keyframe detail modal
  const [selectedKeyframe, setSelectedKeyframe] = useState<KeyframeItem | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Fetch vocabulary suggestions when typing
  const fetchVocabulary = useCallback(async (query: string) => {
    if (!query.trim()) {
      setVocabSuggestions([]);
      setIsVocabLoading(false);
      return;
    }

    setIsVocabLoading(true);
    try {
      const url = `${API_BASE_URL}/keyframes/objects/vocabulary?query=${encodeURIComponent(query.trim())}&limit=20`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Vocabulary fetch failed: ${response.status}`);
      const data: VocabularyItem[] = await response.json();
      setVocabSuggestions(data);
      setSelectedVocabIndex(-1);
    } catch {
      setVocabSuggestions([]);
    } finally {
      setIsVocabLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsDropdownOpen(true);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      void fetchVocabulary(val);
    }, 200);
  };

  const addObject = (objectName: string) => {
    const trimmed = objectName.trim();
    if (!trimmed) return;
    if (!selectedObjects.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedObjects((prev) => [...prev, trimmed]);
    }
    setInputValue('');
    setVocabSuggestions([]);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removeObject = (objectName: string) => {
    setSelectedObjects((prev) => prev.filter((item) => item.toLowerCase() !== objectName.toLowerCase()));
  };

  const togglePopularObject = (objectName: string) => {
    if (selectedObjects.some((item) => item.toLowerCase() === objectName.toLowerCase())) {
      removeObject(objectName);
    } else {
      addObject(objectName);
    }
  };

  const clearAllObjects = () => {
    setSelectedObjects([]);
    setInputValue('');
    setVocabSuggestions([]);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  // Perform search query
  const executeSearch = async (newOffset: number = 0, objectsToSearch?: string[]) => {
    const targetObjects = objectsToSearch || selectedObjects;
    if (targetObjects.length === 0) {
      setSearchError('Vui lòng chọn ít nhất một vật thể để tìm kiếm.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setOffset(newOffset);

    try {
      const response = await fetch(`${API_BASE_URL}/keyframes/search-by-objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objects: targetObjects,
          threshold,
          limit,
          offset: newOffset,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail?.[0]?.msg || `Yêu cầu thất bại (${response.status})`);
      }

      const data: MultiObjectSearchResponse = await response.json();
      setSearchResults(data);
      setActiveSearchMeta({
        objects: [...targetObjects],
        threshold,
        total: data.total,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ tìm kiếm.';
      setSearchError(msg);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const trimmed = inputValue.trim();
      const updated = selectedObjects.some((item) => item.toLowerCase() === trimmed.toLowerCase())
        ? selectedObjects
        : [...selectedObjects, trimmed];
      setSelectedObjects(updated);
      setInputValue('');
      setIsDropdownOpen(false);
      void executeSearch(0, updated);
    } else {
      void executeSearch(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (vocabSuggestions.length > 0) {
        setSelectedVocabIndex((prev) => (prev < vocabSuggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (vocabSuggestions.length > 0) {
        setSelectedVocabIndex((prev) => (prev > 0 ? prev - 1 : vocabSuggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isDropdownOpen && selectedVocabIndex >= 0 && vocabSuggestions[selectedVocabIndex]) {
        e.preventDefault();
        addObject(vocabSuggestions[selectedVocabIndex].class_entity);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedObjects.length > 0) {
      removeObject(selectedObjects[selectedObjects.length - 1]);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal ESC key listener
  useEffect(() => {
    const handleKeyDownModal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedKeyframe(null);
      }
    };
    if (selectedKeyframe) {
      window.addEventListener('keydown', handleKeyDownModal);
      return () => window.removeEventListener('keydown', handleKeyDownModal);
    }
  }, [selectedKeyframe]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const totalPages = searchResults ? Math.ceil(searchResults.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="objects-search-container">
      {/* ─── Header ─── */}
      <header className="objects-search-header">
        <div className="objects-search-title-row">
          <span className="objects-search-sparkle" aria-hidden="true">✻</span>
          <h1 className="objects-search-title">Objects Search</h1>
        </div>
        <p className="objects-search-subtitle">
          Tìm kiếm keyframe theo các vật thể đồng xuất hiện (co-occurring objects) với độ tin cậy được tinh chỉnh.
        </p>
      </header>

      {/* ─── Command Search Card ─── */}
      <section className="objects-command-card" aria-label="Objects search command bar">
        <div className="objects-command-header">
          <span className="objects-command-label">OBJECT CO-OCCURRENCE PIPELINE</span>
          <span className="objects-command-desc">
            Nhập tên vật thể hoặc chọn từ danh mục whitelist OpenImages.
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Multi-Tag Input Field */}
          <div className="objects-tag-input-container">
            <div
              className={`objects-tag-input-box ${isDropdownOpen ? 'is-focused' : ''}`}
              onClick={() => inputRef.current?.focus()}
            >
              <div className="objects-search-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </div>

              {selectedObjects.map((obj) => (
                <span key={obj} className="objects-selected-tag">
                  {obj}
                  <button
                    type="button"
                    className="objects-tag-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeObject(obj);
                    }}
                    title={`Xóa ${obj}`}
                    aria-label={`Remove ${obj}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                ref={inputRef}
                type="text"
                className="objects-input-field"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (inputValue.trim()) setIsDropdownOpen(true);
                }}
                placeholder={
                  selectedObjects.length === 0
                    ? 'Nhập tên đối tượng (ví dụ: Car, Person, Bicycle...)'
                    : 'Thêm đối tượng đồng xuất hiện khác…'
                }
              />

              {selectedObjects.length > 0 && (
                <button
                  type="button"
                  className="objects-clear-all-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAllObjects();
                  }}
                >
                  Xóa hết
                </button>
              )}
            </div>

            {/* Vocabulary Dropdown */}
            {isDropdownOpen && inputValue.trim() && (
              <div className="objects-autocomplete-menu" ref={dropdownRef}>
                {isVocabLoading ? (
                  <div className="objects-autocomplete-loading">Đang tìm trong từ điển vật thể…</div>
                ) : vocabSuggestions.length > 0 ? (
                  vocabSuggestions.map((item, index) => (
                    <button
                      key={item.class_name}
                      type="button"
                      className={`objects-autocomplete-item ${index === selectedVocabIndex ? 'is-selected' : ''}`}
                      onClick={() => addObject(item.class_entity)}
                      onMouseEnter={() => setSelectedVocabIndex(index)}
                    >
                      <span>{item.class_entity}</span>
                      <span className="objects-autocomplete-class">{item.class_name}</span>
                    </button>
                  ))
                ) : (
                  <div className="objects-autocomplete-empty">
                    Không tìm thấy vật thể trong whitelist. Nhấn <strong>Enter</strong> để thêm trực tiếp.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick-Pick Popular Tags */}
          <div className="objects-quick-tags">
            <span className="objects-quick-label">Gợi ý nhanh:</span>
            {POPULAR_OBJECTS.map((name) => {
              const isActive = selectedObjects.some((o) => o.toLowerCase() === name.toLowerCase());
              return (
                <button
                  type="button"
                  key={name}
                  className={`objects-chip-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => togglePopularObject(name)}
                >
                  <span>{isActive ? '✓' : '+'}</span>
                  <span>{name}</span>
                </button>
              );
            })}
          </div>

          {/* Filters & Actions Bar */}
          <div className="objects-controls-row">
            <div className="objects-filter-group">
              {/* Threshold Slider / Select */}
              <div className="objects-filter-item">
                <label htmlFor="obj-threshold">Confidence:</label>
                <div className="objects-slider-wrap">
                  <input
                    id="obj-threshold"
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  />
                  <span className="objects-slider-val">{threshold.toFixed(2)}</span>
                </div>
              </div>

              {/* Items Per Page Limit */}
              <div className="objects-filter-item">
                <label htmlFor="obj-limit">Hiển thị:</label>
                <select
                  id="obj-limit"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                >
                  <option value="12">12 keyframes</option>
                  <option value="24">24 keyframes</option>
                  <option value="48">48 keyframes</option>
                  <option value="96">96 keyframes</option>
                </select>
              </div>
            </div>

            <div className="objects-actions-group">
              {selectedObjects.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={clearAllObjects}
                  disabled={isSearching}
                >
                  Làm mới
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSearching}
                leftIcon={<span aria-hidden="true">↗</span>}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        </form>
      </section>

      {/* ─── Search Results Section ─── */}
      <section className="objects-results-card" aria-live="polite">
        <div className="objects-results-header">
          <div className="objects-results-heading">
            <span className="objects-command-label">OBJECT DETECTIONS</span>
            <h2>
              {activeSearchMeta
                ? `Kết quả tìm kiếm cho [${activeSearchMeta.objects.join(' + ')}]`
                : 'Khám phá keyframe theo đối tượng'}
            </h2>
            {activeSearchMeta && (
              <div className="objects-results-summary">
                <span>
                  Tìm thấy <strong>{formatCount(activeSearchMeta.total)}</strong> keyframes chứa cùng lúc:
                </span>
                <span className="objects-results-tag-list">
                  {activeSearchMeta.objects.map((obj) => (
                    <span key={obj} className="objects-results-tag-pill">{obj}</span>
                  ))}
                </span>
                <span>(Độ tin cậy ≥ {activeSearchMeta.threshold.toFixed(2)})</span>
              </div>
            )}
          </div>
          <span className="objects-results-badge">
            <i /> API v1 Keyframes
          </span>
        </div>

        {/* Loading Skeletons */}
        {isSearching && (
          <div className="objects-keyframe-grid" aria-label="Đang tìm kiếm keyframe...">
            {Array.from({ length: limit > 24 ? 24 : limit }, (_, index) => (
              <div key={index} className="objects-skeleton-card" />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isSearching && searchError && (
          <div className="objects-empty-state is-error">
            <span className="objects-empty-icon" aria-hidden="true">!</span>
            <h3>Không thể thực hiện tìm kiếm</h3>
            <p>{searchError}</p>
            <Button variant="outline" size="sm" onClick={() => void executeSearch(offset)}>
              Thử lại
            </Button>
          </div>
        )}

        {/* Empty Search Results State */}
        {!isSearching && !searchError && searchResults && searchResults.items.length === 0 && (
          <div className="objects-empty-state">
            <span className="objects-empty-icon" aria-hidden="true">∅</span>
            <h3>Không tìm thấy keyframe phù hợp</h3>
            <p>
              Không có keyframe nào chứa đồng thời tất cả các vật thể đã chọn với ngưỡng tin cậy ≥ {threshold.toFixed(2)}.
              Hãy thử giảm ngưỡng tin cậy hoặc bớt bớt một vài đối tượng.
            </p>
          </div>
        )}

        {/* Initial Prompt State */}
        {!isSearching && !searchError && !searchResults && (
          <div className="objects-empty-state">
            <div className="objects-empty-icon" aria-hidden="true">✻</div>
            <h3>Bắt đầu tìm kiếm với các đối tượng mục tiêu</h3>
            <p>
              Chọn một hoặc nhiều đối tượng ở thanh tìm kiếm bên trên và nhấn <strong>Tìm kiếm</strong> để lọc
              các khung hình chứa đồng thời các đối tượng đó.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => void executeSearch(0)}
              style={{ marginTop: '16px' }}
            >
              Tìm thử với [{selectedObjects.join(', ') || 'Car'}]
            </Button>
          </div>
        )}

        {/* Results Grid */}
        {!isSearching && !searchError && searchResults && searchResults.items.length > 0 && (
          <>
            <div className="objects-keyframe-grid">
              {searchResults.items.map((item) => (
                <figure
                  key={item.keyframe_id}
                  className="objects-keyframe-card"
                  onClick={() => setSelectedKeyframe(item)}
                  title={`Xem chi tiết: ${item.video_id} - ${item.keyframe_name}`}
                >
                  <div className="objects-keyframe-media">
                    {item.public_url ? (
                      <img
                        src={item.public_url}
                        alt={`${item.video_id} - ${item.keyframe_name}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="dataset-image-missing">Không có ảnh</div>
                    )}
                    <span className="objects-keyframe-badge">{item.video_id}</span>
                    <span className="objects-keyframe-name-tag">{item.keyframe_name}</span>
                    <div className="objects-keyframe-overlay">
                      <span>Phóng to ↗</span>
                    </div>
                  </div>
                  <figcaption className="objects-keyframe-info">
                    <span>Frame: <strong>{item.frame_idx ?? '—'}</strong></span>
                    <span>Thời gian: <strong>{formatTimestamp(item.timestamp_sec)}</strong></span>
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="objects-pagination">
              <span>
                Hiển thị {offset + 1} - {Math.min(offset + limit, searchResults.total)} trên tổng số {formatCount(searchResults.total)} keyframes
              </span>
              <div className="objects-pagination-buttons">
                <button
                  type="button"
                  onClick={() => void executeSearch(Math.max(0, offset - limit))}
                  disabled={offset === 0 || isSearching}
                >
                  ← Trước
                </button>
                <span>
                  Trang {currentPage} / {totalPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => void executeSearch(offset + limit)}
                  disabled={offset + limit >= searchResults.total || isSearching}
                >
                  Sau →
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ─── Keyframe Detail Modal ─── */}
      {selectedKeyframe && (
        <div
          className="objects-modal-backdrop"
          onClick={() => setSelectedKeyframe(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="objects-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="objects-modal-header">
              <h3>
                <span style={{ color: 'var(--accent-terracotta)' }}>✻</span>
                {selectedKeyframe.video_id} — {selectedKeyframe.keyframe_name}
              </h3>
              <button
                type="button"
                className="objects-modal-close"
                onClick={() => setSelectedKeyframe(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="objects-modal-body">
              <div className="objects-modal-image-wrap">
                {selectedKeyframe.public_url ? (
                  <img
                    src={selectedKeyframe.public_url}
                    alt={`${selectedKeyframe.video_id} - ${selectedKeyframe.keyframe_name}`}
                  />
                ) : (
                  <div style={{ color: 'var(--text-tertiary)' }}>Không có xem trước ảnh</div>
                )}
              </div>

              <div className="objects-modal-details-grid">
                <div className="objects-modal-detail-card">
                  <span>Keyframe ID</span>
                  <strong>#{selectedKeyframe.keyframe_id}</strong>
                </div>
                <div className="objects-modal-detail-card">
                  <span>Video ID</span>
                  <strong>{selectedKeyframe.video_id}</strong>
                </div>
                <div className="objects-modal-detail-card">
                  <span>Tên Frame</span>
                  <strong>{selectedKeyframe.keyframe_name}</strong>
                </div>
                <div className="objects-modal-detail-card">
                  <span>Chỉ số Frame</span>
                  <strong>{selectedKeyframe.frame_idx ?? '—'}</strong>
                </div>
                <div className="objects-modal-detail-card">
                  <span>Mốc thời gian</span>
                  <strong>
                    {formatTimestamp(selectedKeyframe.timestamp_sec)} ({selectedKeyframe.timestamp_sec?.toFixed(2) ?? '—'}s)
                  </strong>
                </div>
                <div className="objects-modal-detail-card">
                  <span>Đường dẫn ảnh</span>
                  <strong style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {selectedKeyframe.image_path}
                  </strong>
                </div>
              </div>

              <div className="objects-modal-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `${selectedKeyframe.video_id} ${selectedKeyframe.frame_idx ?? ''}`,
                      'Đã copy format bài nộp!'
                    )
                  }
                >
                  {copyFeedback === 'Đã copy format bài nộp!' ? '✓ Đã sao chép' : 'Sao chép submission'}
                </Button>
                {selectedKeyframe.public_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(selectedKeyframe.public_url!, 'Đã copy Link ảnh!')
                    }
                  >
                    {copyFeedback === 'Đã copy Link ảnh!' ? '✓ Đã sao chép URL' : 'Sao chép URL ảnh'}
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={() => setSelectedKeyframe(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectsSearchPage;
