import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  searchKeyframeVector,
  type KeyframeVectorSearchItem,
} from '../../../services/api';
import './index.css';

const LIMIT_OPTIONS = [12, 24, 48];
const THRESHOLD_OPTIONS = [
  { label: '0.0 (Tất cả)', value: 0.0 },
  { label: '0.6 (Khá)', value: 0.6 },
  { label: '0.7 (Cao)', value: 0.7 },
  { label: '0.8 (Rất cao)', value: 0.8 },
];

const SCENE_SUGGESTIONS = [
  'người đi xe máy trên phố',
  'phòng họp đông người thảo luận',
  'ô tô màu trắng chạy qua ngã tư',
  'bác sĩ trong bệnh viện',
  'khung cảnh bờ sông lúc hoàng hôn',
  'người phụ nữ mặc áo dài',
];

type SearchState = 'idle' | 'loading' | 'done' | 'error';

export const KeyframeSearchPage: React.FC = () => {
  /* ── Inputs ── */
  const [videoId, setVideoId] = useState('');
  const [query, setQuery] = useState('');
  const [submittedVideoId, setSubmittedVideoId] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  /* ── Filters ── */
  const [threshold, setThreshold] = useState(0.0);
  const [limit, setLimit] = useState(24);
  const [offset, setOffset] = useState(0);

  /* ── Results & State ── */
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [results, setResults] = useState<KeyframeVectorSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Lightbox ── */
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  /* ── Search Execution ── */
  const executeSearch = useCallback(
    async (searchQuery: string, vid?: string, searchOffset: number = 0) => {
      const cleanQuery = searchQuery.trim();
      if (!cleanQuery) return;

      // Convert empty string or whitespace-only to undefined so it is omitted or sent cleanly
      const cleanVid = vid?.trim() ? vid.trim() : undefined;
      const cleanThreshold = Number(threshold) >= 0 ? Number(threshold) : 0.0;
      const cleanLimit = Number(limit) > 0 ? Number(limit) : 24;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearchState('loading');
      setErrorMsg('');
      setSubmittedQuery(cleanQuery);
      setSubmittedVideoId(cleanVid || '');

      try {
        const data = await searchKeyframeVector(
          {
            query: cleanQuery,
            video_id: cleanVid,
            limit: cleanLimit,
            offset: Math.max(0, searchOffset),
            threshold: cleanThreshold > 0 ? cleanThreshold : undefined,
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
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định khi tìm kiếm keyframe vector.');
      }
    },
    [limit, threshold],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    executeSearch(query, videoId, 0);
  };

  const handlePageChange = (newOffset: number) => {
    executeSearch(submittedQuery || query, submittedVideoId || videoId, newOffset);
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setOffset(0);
    setTimeout(() => executeSearch(suggestion, videoId, 0), 0);
  };

  /* ── Lightbox Keyboard Navigation ── */
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

  /* ── Helpers ── */
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const canSubmit = query.trim().length >= 2;

  const formatTimestamp = (sec: number | null): string => {
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
        return 'Đang so khớp CLIP visual…';
      case 'done':
        return `${total.toLocaleString()} keyframes khớp`;
      case 'error':
        return 'Lỗi';
    }
  };

  return (
    <div className="keyframe-search-page">
      {/* ── Header ── */}
      <header className="keyframe-header">
        <div className="keyframe-header-row">
          <span className="sparkle" aria-hidden="true">✻</span>
          <h1>Keyframe Search</h1>
        </div>
        <p className="keyframe-subtitle">
          Tìm kiếm hình ảnh thị giác ngữ nghĩa toàn cục trên toàn bộ kho dữ liệu hoặc trong từng video cụ thể bằng mô hình CLIP ViT-B/32.
        </p>
      </header>

      {/* ── Search Command Card ── */}
      <section className="keyframe-command-card" aria-label="Keyframe vector search command bar">
        <div className="keyframe-command-intro">
          <span className="keyframe-command-label">CLIP KEYFRAME SEARCH</span>
          <span>Nhập mô tả cảnh thị giác và tùy chọn giới hạn theo Video ID để tìm các khung hình tương đồng nhất.</span>
        </div>

        <form className="keyframe-command-form" onSubmit={handleSubmit}>
          <div className="keyframe-inputs-stack">
            {/* Video ID Input (Optional) */}
            <div className="keyframe-video-selector">
              <label className="keyframe-video-label" htmlFor="kf-video-id">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <span>Video ID</span>
                <span className="keyframe-optional-tag">(Tùy chọn - để trống để tìm toàn cục)</span>
              </label>
              <input
                id="kf-video-id"
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="VD: L21_V001 (để trống để tìm trên toàn bộ dataset)…"
                aria-label="Video ID (Tùy chọn)"
                autoComplete="off"
                className="keyframe-video-input"
              />
              {videoId && (
                <button
                  type="button"
                  className="keyframe-clear-button"
                  onClick={() => setVideoId('')}
                  aria-label="Xóa Video ID"
                >
                  ×
                </button>
              )}
            </div>

            {/* Scene Description Query Input */}
            <div className="keyframe-query-input-wrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mô tả cảnh hoặc chi tiết hình ảnh cần tìm (VD: người đi xe máy trong mưa)…"
                aria-label="Scene description query"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="keyframe-clear-button"
                  onClick={() => setQuery('')}
                  aria-label="Xóa truy vấn"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="keyframe-controls">
            <div className="keyframe-filter-list">
              {/* Threshold Selector */}
              <label className="keyframe-filter">
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

              {/* Limit Selector */}
              <label className="keyframe-filter">
                <span>Số lượng</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  aria-label="Limit results per page"
                >
                  {LIMIT_OPTIONS.map((opt) => (
                    <option value={opt} key={opt}>
                      {opt} frame / trang
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
              {videoId.trim() ? 'Tìm Trong Video' : 'Tìm Kiếm Toàn Cục'}
            </Button>
          </div>
        </form>
      </section>

      {/* ── Results Card ── */}
      <section className="keyframe-results-card" aria-live="polite">
        <div className="keyframe-results-header">
          <div>
            <span className="keyframe-results-eyebrow">CLIP VISUAL SIMILARITY</span>
            <h2>
              {searchState === 'done' && results.length > 0
                ? submittedVideoId
                  ? `Keyframes trong video ${submittedVideoId} cho “${submittedQuery}”`
                  : `Kết quả tìm kiếm toàn cục cho “${submittedQuery}”`
                : searchState === 'loading'
                  ? 'Đang tính toán vector thị giác CLIP…'
                  : 'Nhập mô tả cảnh thị giác để tìm kiếm keyframe'}
            </h2>
          </div>
          <span className={`keyframe-results-status ${searchState}`}>
            <i />
            {statusLabel()}
          </span>
        </div>

        {/* Idle State */}
        {searchState === 'idle' && (
          <div className="keyframe-empty-state">
            <div className="keyframe-empty-icon" aria-hidden="true">✻</div>
            <h3>Tìm kiếm khung hình qua CLIP Embedding</h3>
            <p>
              Nhập mô tả cảnh trực quan để tìm kiếm toàn bộ kho video, hoặc nhập Video ID để khoanh vùng tìm kiếm trong một video nhất định.
            </p>
            <div className="keyframe-suggestions">
              {SCENE_SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => handleSuggestion(s)}>
                  {s}
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="keyframe-preview-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} />)}
            </div>
          </div>
        )}

        {/* Loading State */}
        {searchState === 'loading' && (
          <div className="keyframe-skeleton-grid">
            {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
              <div className="keyframe-skeleton-card" key={i}>
                <div className="keyframe-skeleton-img" />
                <div className="keyframe-skeleton-meta">
                  <div className="keyframe-skeleton-line w-60" />
                  <div className="keyframe-skeleton-line w-40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {searchState === 'error' && (
          <div className="keyframe-empty-state">
            <div className="keyframe-empty-icon" aria-hidden="true" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.12)' }}>!</div>
            <h3>Không thể hoàn thành tìm kiếm</h3>
            <p>{errorMsg}</p>
            <div style={{ marginTop: '16px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => executeSearch(submittedQuery || query, submittedVideoId || videoId, offset)}
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        {searchState === 'done' && results.length > 0 && (
          <>
            <div className="keyframe-gallery-grid">
              {results.map((item, idx) => (
                <div
                  className="keyframe-card"
                  key={item.keyframe_id || `${item.video_id}-${item.keyframe_name}-${idx}`}
                  onClick={() => setLightboxIdx(idx)}
                >
                  <div className="keyframe-card-img-wrap">
                    {item.public_url ? (
                      <img
                        src={item.public_url}
                        alt={`${item.video_id} — ${item.keyframe_name}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="keyframe-card-placeholder">Không có ảnh</div>
                    )}
                    <span className="keyframe-video-badge">
                      {item.video_id}
                    </span>
                    <span className="keyframe-sim-badge" title="CLIP Similarity Score">
                      {(item.similarity * 100).toFixed(1)}% match
                    </span>
                  </div>

                  <div className="keyframe-card-meta">
                    <div className="keyframe-card-id-row">
                      <span className="keyframe-card-name" title={item.keyframe_name}>
                        #{item.keyframe_name}
                      </span>
                    </div>
                    <div className="keyframe-card-sub">
                      <span>Frame #{item.frame_idx ?? '—'}</span>
                      {item.timestamp_sec != null && (
                        <>
                          <span>·</span>
                          <span>{formatTimestamp(item.timestamp_sec)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="keyframe-pagination">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(offset - limit)}
                >
                  ← Trước
                </button>
                <span className="keyframe-pagination-info">
                  Trang {currentPage} / {totalPages} · {total.toLocaleString()} keyframes
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
          <div className="keyframe-empty-state">
            <div className="keyframe-empty-icon" aria-hidden="true">⌁</div>
            <h3>Không tìm thấy keyframe phù hợp</h3>
            <p>
              {submittedVideoId
                ? `Không có keyframe nào trong video “${submittedVideoId}” khớp với “${submittedQuery}”`
                : `Không có keyframe nào trong dataset khớp với “${submittedQuery}”`}
              {threshold > 0 && ` ở ngưỡng similarity ≥ ${threshold}`}. Hãy thử hạ threshold hoặc đổi câu mô tả cảnh.
            </p>
          </div>
        )}
      </section>

      {/* ── Lightbox Modal ── */}
      {lightboxItem && (
        <div className="keyframe-lightbox-overlay" onClick={() => setLightboxIdx(null)}>
          <div className="keyframe-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="keyframe-lightbox-close"
              onClick={() => setLightboxIdx(null)}
              aria-label="Đóng"
            >
              ×
            </button>

            {/* Previous Frame Arrow */}
            <button
              className="keyframe-lightbox-arrow keyframe-lightbox-prev"
              disabled={lightboxIdx === 0}
              onClick={() => setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
              aria-label="Ảnh trước"
            >
              ‹
            </button>

            {/* Image */}
            {lightboxItem.public_url ? (
              <img
                className="keyframe-lightbox-img"
                src={lightboxItem.public_url}
                alt={`${lightboxItem.video_id} — ${lightboxItem.keyframe_name}`}
              />
            ) : (
              <div className="keyframe-card-placeholder" style={{ width: 360, height: 200, borderRadius: 12 }}>
                Không có ảnh
              </div>
            )}

            {/* Next Frame Arrow */}
            <button
              className="keyframe-lightbox-arrow keyframe-lightbox-next"
              disabled={lightboxIdx === results.length - 1}
              onClick={() => setLightboxIdx((prev) => (prev !== null && prev < results.length - 1 ? prev + 1 : prev))}
              aria-label="Ảnh sau"
            >
              ›
            </button>

            {/* Lightbox Footer */}
            <div className="keyframe-lightbox-footer">
              <span className="keyframe-lightbox-video">{lightboxItem.video_id}</span>
              <span className="keyframe-lightbox-sep">·</span>
              <span className="keyframe-lightbox-frame">{lightboxItem.keyframe_name}</span>
              {lightboxItem.frame_idx != null && (
                <>
                  <span className="keyframe-lightbox-sep">·</span>
                  <span className="keyframe-lightbox-frame">Frame #{lightboxItem.frame_idx}</span>
                </>
              )}
              {lightboxItem.timestamp_sec != null && (
                <>
                  <span className="keyframe-lightbox-sep">·</span>
                  <span className="keyframe-lightbox-frame">{formatTimestamp(lightboxItem.timestamp_sec)}</span>
                </>
              )}
              <span className="keyframe-lightbox-sep">·</span>
              <span style={{ color: 'var(--accent-terracotta)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {(lightboxItem.similarity * 100).toFixed(1)}% match
              </span>
              <span className="keyframe-lightbox-counter">
                {(lightboxIdx ?? 0) + 1} / {results.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyframeSearchPage;
