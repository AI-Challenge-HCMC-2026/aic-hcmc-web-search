import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  searchVideoVector,
  type VideoVectorSearchItem,
} from '../../../services/api';
import './index.css';

const LIMIT_OPTIONS = [10, 20, 50];
const THRESHOLD_OPTIONS = [
  { label: '0.0 (Tất cả)', value: 0.0 },
  { label: '0.5 (Trung bình)', value: 0.5 },
  { label: '0.6 (Khá)', value: 0.6 },
  { label: '0.7 (Cao)', value: 0.7 },
  { label: '0.8 (Rất cao)', value: 0.8 },
];

const SUGGESTIONS = [
  'trí tuệ nhân tạo',
  'tai nạn giao thông',
  'dự báo thời tiết',
  'người đi xe máy',
  'phòng chống dịch bệnh',
  'chuyển đổi số quốc gia',
];

type SearchState = 'idle' | 'loading' | 'done' | 'error';

export const VideoSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [threshold, setThreshold] = useState(0.0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [results, setResults] = useState<VideoVectorSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Lightbox Preview ── */
  const [previewItem, setPreviewItem] = useState<VideoVectorSearchItem | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  /* ── Search Execution ── */
  const executeSearch = useCallback(
    async (searchQuery: string, searchOffset: number = 0) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearchState('loading');
      setErrorMsg('');
      setSubmittedQuery(trimmed);

      try {
        const data = await searchVideoVector(
          {
            query: trimmed,
            limit,
            offset: searchOffset,
            threshold: threshold > 0 ? threshold : undefined,
          },
          controller.signal,
        );

        setResults(data.items || []);
        setTotal(data.total || 0);
        setOffset(searchOffset);
        setSearchState('done');
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSearchState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định khi tìm kiếm video vector.');
      }
    },
    [limit, threshold],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    executeSearch(query, 0);
  };

  const handlePageChange = (newOffset: number) => {
    executeSearch(submittedQuery || query, newOffset);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    setOffset(0);
    setTimeout(() => executeSearch(s, 0), 0);
  };

  /* ── Lightbox Keyboard listener ── */
  useEffect(() => {
    if (!previewItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewItem(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewItem]);

  /* ── Helpers ── */
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const canSubmit = query.trim().length >= 1;

  const formatSeconds = (sec: number | null): string => {
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
        return 'Đang so khớp ngữ nghĩa…';
      case 'done':
        return `${total.toLocaleString()} phân đoạn video`;
      case 'error':
        return 'Lỗi';
    }
  };

  return (
    <div className="video-search-page">
      {/* ── Header ── */}
      <header className="video-header">
        <div className="video-header-row">
          <span className="sparkle" aria-hidden="true">✻</span>
          <h1>Video Search</h1>
        </div>
        <p className="video-subtitle">
          Tìm kiếm ngữ nghĩa toàn cục trên toàn bộ transcript phân đoạn video bằng mô hình nhúng Ollama Embedding.
        </p>
      </header>

      {/* ── Search Command Card ── */}
      <section className="video-command-card" aria-label="Video search command bar">
        <div className="video-command-intro">
          <span className="video-command-label">VIDEO VECTOR SEARCH</span>
          <span>Truy vấn bằng ngôn ngữ tự nhiên để tìm các phân đoạn video khớp về nội dung và ngữ cảnh.</span>
        </div>

        <form className="video-command-form" onSubmit={handleSubmit}>
          <div className="video-input-wrap">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập nội dung, câu thoại hoặc ngữ cảnh cần tìm (VD: tai nạn giao thông, dự báo thời tiết)…"
              aria-label="Video search query"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="video-clear-button"
                onClick={() => setQuery('')}
                aria-label="Xóa truy vấn"
              >
                ×
              </button>
            )}
          </div>

          <div className="video-controls">
            <div className="video-filter-list">
              {/* Threshold Filter */}
              <label className="video-filter">
                <span>Threshold</span>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  aria-label="Similarity Threshold"
                >
                  {THRESHOLD_OPTIONS.map((opt) => (
                    <option value={opt.value} key={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Limit Filter */}
              <label className="video-filter">
                <span>Số lượng</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  aria-label="Limit results per page"
                >
                  {LIMIT_OPTIONS.map((opt) => (
                    <option value={opt} key={opt}>
                      {opt} phân đoạn / trang
                    </option>
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
              Tìm kiếm
            </Button>
          </div>
        </form>
      </section>

      {/* ── Results Card ── */}
      <section className="video-results-card" aria-live="polite">
        <div className="video-results-header">
          <div>
            <span className="video-results-eyebrow">TRANSCRIPT VECTOR MATCHES</span>
            <h2>
              {searchState === 'done' && results.length > 0
                ? `Kết quả cho “${submittedQuery}”`
                : searchState === 'loading'
                  ? 'Đang tính toán vector similarity…'
                  : 'Nhập câu truy vấn để bắt đầu'}
            </h2>
          </div>
          <span className={`video-results-status ${searchState}`}>
            <i />
            {statusLabel()}
          </span>
        </div>

        {/* Idle State */}
        {searchState === 'idle' && (
          <div className="video-empty-state">
            <div className="video-empty-icon" aria-hidden="true">✻</div>
            <h3>Tìm kiếm ngữ nghĩa qua nội dung Video</h3>
            <p>
              Nhập bất kỳ ý tưởng, chủ đề hoặc câu hội thoại. Hệ thống so khớp vector trên toàn bộ transcript của các phân đoạn video trong cơ sở dữ liệu.
            </p>
            <div className="video-suggestions">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => handleSuggestion(s)}>
                  {s}
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="video-preview-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} />)}
            </div>
          </div>
        )}

        {/* Loading State */}
        {searchState === 'loading' && (
          <div className="video-skeleton-list">
            {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
              <div className="video-skeleton-card" key={i}>
                <div className="video-skeleton-thumb" />
                <div className="video-skeleton-body">
                  <div className="video-skeleton-line w-40" />
                  <div className="video-skeleton-line w-100" />
                  <div className="video-skeleton-line w-70" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {searchState === 'error' && (
          <div className="video-empty-state">
            <div className="video-empty-icon" aria-hidden="true" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.12)' }}>!</div>
            <h3>Không thể hoàn thành tìm kiếm</h3>
            <p>{errorMsg}</p>
            <div style={{ marginTop: '16px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => executeSearch(submittedQuery || query, offset)}
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Results List */}
        {searchState === 'done' && results.length > 0 && (
          <>
            <div className="video-results-list">
              {results.map((item, idx) => (
                <article className="video-result-item" key={`${item.video_id}-${item.segment_id || idx}`}>
                  {/* Thumbnail Wrap */}
                  <div
                    className="video-thumb-wrap"
                    onClick={() => setPreviewItem(item)}
                    title="Bấm để xem ảnh phóng to"
                  >
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title || item.video_id}
                        className="video-thumb-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="video-thumb-placeholder">No thumbnail</div>
                    )}
                    <span className="video-badge-overlay">{item.video_id}</span>
                    <div className="video-thumb-overlay">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                      <span>Xem ảnh</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="video-item-body">
                    <div className="video-item-header">
                      <div className="video-badges-row">
                        {item.collection_name && (
                          <span className="video-collection-badge">
                            {item.collection_name}
                          </span>
                        )}
                        <span className="video-segment-badge">
                          Segment #{item.segment_index}
                        </span>
                      </div>
                      <span className="video-similarity-badge" title="Độ tương đồng ngữ nghĩa vector">
                        {(item.similarity * 100).toFixed(1)}% match
                      </span>
                    </div>

                    <h3 className="video-item-title">
                      {item.title || item.file_name || item.video_id}
                    </h3>

                    {/* Matched Transcript Snippet */}
                    <div className="video-transcript-box">
                      <span className="video-transcript-quote">
                        “{item.transcript_text}”
                      </span>
                    </div>

                    {/* Footer Meta */}
                    <div className="video-item-meta">
                      <span>📁 {item.file_name}</span>
                      {item.author && <span>👤 {item.author}</span>}
                      {item.length_seconds != null && (
                        <span>⏱ {formatSeconds(item.length_seconds)}</span>
                      )}
                      {item.video_path && <span>🔗 {item.video_path}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="video-pagination">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(offset - limit)}
                >
                  ← Trước
                </button>
                <span className="video-pagination-info">
                  Trang {currentPage} / {totalPages} · {total.toLocaleString()} kết quả
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
          <div className="video-empty-state">
            <div className="video-empty-icon" aria-hidden="true">⌁</div>
            <h3>Không tìm thấy phân đoạn video phù hợp</h3>
            <p>
              Không có transcript phân đoạn nào khớp với “{submittedQuery}”
              {threshold > 0 && ` ở ngưỡng similarity ≥ ${threshold}`}. Hãy thử giảm threshold hoặc dùng các từ khóa miêu tả khác.
            </p>
          </div>
        )}
      </section>

      {/* ── Thumbnail Lightbox ── */}
      {previewItem && (
        <div className="video-lightbox-overlay" onClick={() => setPreviewItem(null)}>
          <div className="video-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="video-lightbox-close"
              onClick={() => setPreviewItem(null)}
              aria-label="Đóng"
            >
              ×
            </button>

            {previewItem.thumbnail_url ? (
              <img
                className="video-lightbox-img"
                src={previewItem.thumbnail_url}
                alt={previewItem.title || previewItem.video_id}
              />
            ) : (
              <div className="video-thumb-placeholder" style={{ width: 360, height: 200, borderRadius: 12 }}>
                Không có thumbnail
              </div>
            )}

            <div className="video-lightbox-footer">
              <span className="video-lightbox-id">{previewItem.video_id}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span className="video-lightbox-title">{previewItem.title || previewItem.file_name}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--accent-terracotta)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {(previewItem.similarity * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSearchPage;
