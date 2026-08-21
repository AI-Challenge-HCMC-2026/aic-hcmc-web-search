import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  searchByObjects,
  type KeyframeItem,
} from '../../../services/api';
import { getGeminiConfig } from '../../../services/settings';
import './index.css';

const LIMIT_OPTIONS = [12, 24, 48];

const SUGGESTION_QUERIES = [
  'người đi xe đạp',
  'ô tô đỗ bên đường',
  'người cầm ô',
  'con chó nằm trên ghế',
  'xe máy gần biển báo',
  'một người đứng cạnh cây',
];

type SearchState = 'idle' | 'loading' | 'done' | 'error';

export const ObjectsSearchPage: React.FC = () => {
  /* ── Video ID ── */
  const [videoId, setVideoId] = useState('');

  /* ── Query ── */
  const [query, setQuery] = useState('');

  /* ── Filters ── */
  const [threshold, setThreshold] = useState(0.5);
  const [limit, setLimit] = useState(24);

  /* ── Results ── */
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [results, setResults] = useState<KeyframeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [extractedObjects, setExtractedObjects] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Lightbox ── */
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  /* ─── Search execution ─── */
  const executeSearch = useCallback(
    async (searchQuery: string, videoId: string, searchOffset: number = 0) => {
      if (!searchQuery.trim() || !videoId) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearchState('loading');
      setErrorMsg('');
      setExtractedObjects([]);

      try {
        const geminiConfig = getGeminiConfig();
        const data = await searchByObjects(
          {
            video_id: videoId,
            query: searchQuery.trim(),
            gemini_config: geminiConfig,
            threshold,
            limit,
            offset: searchOffset,
          },
          controller.signal,
        );
        setResults(data.items);
        setTotal(data.total);
        setOffset(searchOffset);
        setExtractedObjects(data.extracted_objects ?? []);
        setSearchState('done');
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSearchState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định');
      }
    },
    [threshold, limit],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    executeSearch(query, videoId, 0);
  };

  const handlePageChange = (newOffset: number) => {
    executeSearch(query, videoId, newOffset);
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setTimeout(() => executeSearch(suggestion, videoId, 0), 0);
  };

  /* ─── Lightbox keyboard navigation ─── */
  useEffect(() => {
    if (lightboxIdx === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIdx(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev !== null && prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [lightboxIdx, results.length]);

  const lightboxItem = lightboxIdx !== null ? results[lightboxIdx] : null;

  /* ─── Helpers ─── */
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const canSubmit = query.trim().length >= 2 && !!videoId;

  const formatTimestamp = (sec: number | null) => {
    if (sec == null) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const statusLabel = (): string => {
    switch (searchState) {
      case 'idle':
        return 'Sẵn sàng tìm kiếm';
      case 'loading':
        return 'Đang phân tích & tìm kiếm…';
      case 'done':
        return `${total.toLocaleString()} kết quả`;
      case 'error':
        return 'Lỗi';
    }
  };

  return (
    <div className="objects-search-page">
      {/* ── Header ── */}
      <header className="objects-header">
        <div className="objects-header-row">
          <span className="sparkle" aria-hidden="true">✻</span>
          <h1>Objects Search</h1>
        </div>
        <p className="objects-subtitle">
          Mô tả vật thể bằng ngôn ngữ tự nhiên — Gemini tự động nhận diện và tìm kiếm keyframe chứa các vật thể trong video.
        </p>
      </header>

      {/* ── Search Command Card ── */}
      <section className="objects-command-card" aria-label="Object search command bar">
        <div className="objects-command-intro">
          <span className="objects-command-label">OBJECT SEARCH</span>
          <span>Nhập mô tả cảnh và chọn video. Gemini sẽ trích xuất vật thể và tìm keyframe phù hợp.</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="objects-tags-area">
            {/* Video ID Input */}
            <div className="objects-video-selector">
              <label className="objects-video-label" htmlFor="video-id-input">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Video
              </label>
              <input
                id="video-id-input"
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="Nhập Video ID (VD: L21_V001)…"
                aria-label="Video ID"
                autoComplete="off"
                className="objects-video-input"
              />
            </div>

            {/* Natural Language Query Input */}
            <div className="objects-tags-input-wrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mô tả vật thể cần tìm (VD: người cầm ô đứng cạnh xe máy)…"
                aria-label="Object query"
                autoComplete="off"
              />
              {query && (
                <button type="button" className="search-clear-button" onClick={() => setQuery('')} aria-label="Clear" style={{ padding: '2px 5px', color: 'var(--text-tertiary)', background: 'transparent', border: 0, fontSize: 20, cursor: 'pointer' }}>
                  ×
                </button>
              )}
            </div>

            {/* Filters + Submit */}
            <div className="objects-controls">
              <div className="objects-filter-list">
                <label className="objects-filter">
                  <span>Threshold</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={threshold}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setThreshold(Math.min(1, Math.max(0, v)));
                    }}
                    aria-label="Threshold"
                    className="objects-threshold-input"
                  />
                </label>
                <label className="objects-filter">
                  <span>Limit</span>
                  <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} aria-label="Limit">
                    {LIMIT_OPTIONS.map((l) => (
                      <option value={l} key={l}>{l}</option>
                    ))}
                  </select>
                </label>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<span aria-hidden="true">↗</span>}
                disabled={!canSubmit}
                isLoading={searchState === 'loading'}
              >
                Search
              </Button>
            </div>
          </div>
        </form>
      </section>

      {/* ── Results Card ── */}
      <section className="objects-results-card" aria-live="polite">
        <div className="objects-results-header">
          <div>
            <span className="objects-results-eyebrow">OBJECT DETECTIONS</span>
            <h2>
              {searchState === 'done' && results.length > 0
                ? `Kết quả trong ${videoId}`
                : searchState === 'loading'
                  ? 'Đang phân tích vật thể…'
                  : 'Nhập mô tả và chọn video để bắt đầu'}
            </h2>
          </div>
          <span className={`objects-results-status ${searchState}`}>
            <i />
            {statusLabel()}
          </span>
        </div>

        {/* Extracted Objects Badge Row */}
        {searchState === 'done' && extractedObjects.length > 0 && (
          <div className="objects-extracted-row">
            <span className="objects-extracted-label">Gemini trích xuất:</span>
            {extractedObjects.map((obj) => (
              <span className="object-tag" key={obj}>{obj}</span>
            ))}
          </div>
        )}

        {/* Idle State */}
        {searchState === 'idle' && (
          <div className="objects-empty-state">
            <div className="objects-empty-icon" aria-hidden="true">✻</div>
            <h3>Mô tả vật thể để tìm kiếm</h3>
            <p>Nhập mô tả bằng ngôn ngữ tự nhiên. Gemini sẽ tự động nhận diện các vật thể từ câu mô tả và tìm keyframe chứa chúng trong video đã chọn.</p>
            <div className="objects-suggestions">
              {SUGGESTION_QUERIES.map((s) => (
                <button type="button" key={s} onClick={() => handleSuggestion(s)}>
                  {s}
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="objects-preview-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} />)}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {searchState === 'loading' && (
          <div className="objects-skeleton-grid">
            {Array.from({ length: limit > 12 ? 12 : limit }).map((_, i) => (
              <div className="objects-skeleton-item" key={i}>
                <div className="objects-skeleton-img" />
                <div className="objects-skeleton-meta">
                  <div className="objects-skeleton-line" />
                  <div className="objects-skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {searchState === 'error' && (
          <div className="objects-empty-state">
            <div className="objects-error-message">
              <div className="objects-empty-icon" aria-hidden="true" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.12)' }}>!</div>
              <h3>Không thể hoàn thành tìm kiếm</h3>
              <p>{errorMsg}</p>
              <Button variant="secondary" size="sm" onClick={() => executeSearch(query, videoId, offset)}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {searchState === 'done' && results.length > 0 && (
          <>
            <div className="objects-results-grid">
              {results.map((item, idx) => (
                <div className="objects-result-item" key={item.keyframe_id} onClick={() => setLightboxIdx(idx)}>
                  <img
                    src={item.public_url ?? ''}
                    alt={`${item.video_id} — ${item.keyframe_name}`}
                    loading="lazy"
                  />
                  <span className="objects-result-badge">
                    Frame #{item.frame_idx ?? '—'}
                  </span>
                  <div className="objects-result-meta">
                    <span className="objects-result-video">{item.video_id}</span>
                    <span className="objects-result-frame">
                      Frame {item.frame_idx ?? '—'} · {item.keyframe_name}
                      {item.timestamp_sec != null && ` · ${formatTimestamp(item.timestamp_sec)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="objects-pagination">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(offset - limit)}
                >
                  ← Trước
                </button>
                <span className="objects-pagination-info">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(offset + limit)}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {searchState === 'done' && results.length === 0 && (
          <div className="objects-empty-state">
            <div className="objects-empty-icon" aria-hidden="true">⌁</div>
            <h3>Không tìm thấy kết quả</h3>
            <p>
              Không có keyframe nào trong video {videoId} chứa các vật thể
              {extractedObjects.length > 0 && ` [${extractedObjects.join(', ')}]`} với threshold ≥ {threshold}. Thử giảm threshold hoặc thay đổi mô tả.
            </p>
          </div>
        )}
      </section>

      {/* ── Lightbox Modal ── */}
      {lightboxItem && (
        <div className="lightbox-overlay" onClick={() => setLightboxIdx(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button className="lightbox-close" onClick={() => setLightboxIdx(null)} aria-label="Đóng">×</button>

            {/* Prev arrow */}
            <button
              className="lightbox-arrow lightbox-prev"
              disabled={lightboxIdx === 0}
              onClick={() => setLightboxIdx((p) => (p !== null && p > 0 ? p - 1 : p))}
              aria-label="Ảnh trước"
            >
              ‹
            </button>

            {/* Image */}
            <img
              className="lightbox-img"
              src={lightboxItem.public_url ?? ''}
              alt={`${lightboxItem.video_id} — ${lightboxItem.keyframe_name}`}
            />

            {/* Next arrow */}
            <button
              className="lightbox-arrow lightbox-next"
              disabled={lightboxIdx === results.length - 1}
              onClick={() => setLightboxIdx((p) => (p !== null && p < results.length - 1 ? p + 1 : p))}
              aria-label="Ảnh sau"
            >
              ›
            </button>

            {/* Footer metadata */}
            <div className="lightbox-footer">
              <span className="lightbox-video">{lightboxItem.video_id}</span>
              <span className="lightbox-sep">·</span>
              <span className="lightbox-frame">{lightboxItem.keyframe_name}</span>
              {lightboxItem.frame_idx != null && (
                <>
                  <span className="lightbox-sep">·</span>
                  <span className="lightbox-frame">Frame #{lightboxItem.frame_idx}</span>
                </>
              )}
              {lightboxItem.timestamp_sec != null && (
                <>
                  <span className="lightbox-sep">·</span>
                  <span className="lightbox-frame">{formatTimestamp(lightboxItem.timestamp_sec)}</span>
                </>
              )}
              <span className="lightbox-counter">{lightboxIdx! + 1} / {results.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectsSearchPage;
