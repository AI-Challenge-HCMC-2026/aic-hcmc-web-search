import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  searchFullText,
  type FullTextSearchItem,
} from '../../../services/api';
import { getGeminiConfig } from '../../../services/settings';
import './index.css';

const LIMIT_OPTIONS = [10, 20, 50];

const SUGGESTIONS = [
  'thành phố hồ chí minh',
  'sở y tế',
  'tai nạn giao thông',
  'dự báo thời tiết',
  'triệt phá đường dây',
  'chương trình thời sự',
];

type SearchState = 'idle' | 'loading' | 'done' | 'error';

export const FulltextSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [results, setResults] = useState<FullTextSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [optimizedTsquery, setOptimizedTsquery] = useState<string | null>(null);
  const [extractedEntities, setExtractedEntities] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Lightbox preview ── */
  const [previewItem, setPreviewItem] = useState<FullTextSearchItem | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  /* ── Search execution ── */
  const executeSearch = useCallback(
    async (searchQuery: string, searchOffset: number = 0) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearchState('loading');
      setErrorMsg('');
      setSubmittedQuery(trimmed);

      try {
        const geminiConfig = getGeminiConfig();
        const data = await searchFullText(
          {
            query: trimmed,
            gemini_config: geminiConfig,
            limit,
            offset: searchOffset,
          },
          controller.signal,
        );
        setResults(data.items);
        setTotal(data.total);
        setOffset(searchOffset);
        setOptimizedTsquery(data.optimized_tsquery);
        setExtractedEntities(data.extracted_entities ?? []);
        setSearchState('done');
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSearchState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định khi tìm kiếm.');
      }
    },
    [limit],
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

  /* ── Pagination ── */
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const canSubmit = query.trim().length >= 2;

  const statusLabel = (): string => {
    switch (searchState) {
      case 'idle':
        return 'Sẵn sàng tìm kiếm';
      case 'loading':
        return 'Đang tìm kiếm FTS…';
      case 'done':
        return `${total.toLocaleString()} video phù hợp`;
      case 'error':
        return 'Lỗi';
    }
  };

  return (
    <div className="fts-page-container">
      {/* ── Header ── */}
      <header className="fts-header">
        <div className="fts-title-row">
          <span className="fts-sparkle" aria-hidden="true">✻</span>
          <h1>Full Text Search</h1>
        </div>
        <p className="fts-subtitle">
          Tìm kiếm toàn văn PostgreSQL qua transcript ASR (0.5), tiêu đề (0.2), mô tả (0.2) và từ khóa (0.1).
        </p>
      </header>

      {/* ── Search Command Card ── */}
      <section className="fts-command-card" aria-label="Full-text search command bar">
        <div className="fts-command-intro">
          <span className="fts-command-label">FULL-TEXT SEARCH</span>
          <span>Tìm kiếm câu thoại trong video, tiêu đề, và nội dung liên quan.</span>
        </div>

        <form className="fts-command-form" onSubmit={handleSubmit}>
          <div className="fts-input-wrap">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập từ khóa, câu thoại hoặc tiêu đề cần tìm…"
              aria-label="Full-text search query"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="fts-clear-button"
                onClick={() => setQuery('')}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>

          <div className="fts-command-controls">
            <div className="fts-filter-list">
              <label className="fts-filter">
                <span>Số lượng</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  aria-label="Limit"
                >
                  {LIMIT_OPTIONS.map((opt) => (
                    <option value={opt} key={opt}>
                      {opt} video
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
      <section className="fts-results-card" aria-live="polite">
        <div className="fts-results-header">
          <div>
            <span className="fts-results-eyebrow">POSTGRESQL FTS MATCHES</span>
            <h2>
              {searchState === 'done' && results.length > 0
                ? `Kết quả cho “${submittedQuery}”`
                : searchState === 'loading'
                  ? 'Đang truy vấn cơ sở dữ liệu…'
                  : 'Nhập từ khóa để bắt đầu'}
            </h2>
          </div>
          <span className={`fts-results-status ${searchState}`}>
            <i />
            {statusLabel()}
          </span>
        </div>

        {/* Query Insights Bar */}
        {searchState === 'done' && (optimizedTsquery || extractedEntities.length > 0) && (
          <div className="fts-insight-bar">
            {optimizedTsquery && (
              <div className="fts-insight-row">
                <span className="fts-insight-tag">tsquery:</span>
                <code className="fts-tsquery-code">{optimizedTsquery}</code>
              </div>
            )}
            {extractedEntities.length > 0 && (
              <div className="fts-insight-row">
                <span className="fts-insight-tag">Thực thể trích xuất:</span>
                <div className="fts-entities-list">
                  {extractedEntities.map((ent) => (
                    <span className="fts-entity-chip" key={ent}>
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Idle State */}
        {searchState === 'idle' && (
          <div className="fts-empty-state">
            <div className="fts-empty-icon" aria-hidden="true">✻</div>
            <h3>Khám phá video qua nội dung văn bản</h3>
            <p>
              Nhập bất kỳ câu thoại, chủ đề thời sự, tên địa danh hoặc từ khóa. Hệ thống sẽ so khớp toàn văn có trọng số trên toàn bộ kho video.
            </p>
            <div className="fts-suggestions">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => handleSuggestion(s)}>
                  {s}
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="fts-preview-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} />)}
            </div>
          </div>
        )}

        {/* Loading State */}
        {searchState === 'loading' && (
          <div className="fts-skeleton-list">
            {Array.from({ length: limit > 6 ? 6 : limit }).map((_, i) => (
              <div className="fts-skeleton-card" key={i}>
                <div className="fts-skeleton-thumb" />
                <div className="fts-skeleton-body">
                  <div className="fts-skeleton-line w-80" />
                  <div className="fts-skeleton-line w-100" />
                  <div className="fts-skeleton-line w-50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {searchState === 'error' && (
          <div className="fts-empty-state">
            <div className="fts-error-message">
              <div className="fts-empty-icon" aria-hidden="true" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.12)' }}>!</div>
              <h3>Không thể hoàn thành tìm kiếm</h3>
              <p>{errorMsg}</p>
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
            <div className="fts-results-list">
              {results.map((item) => (
                <article className="fts-result-card" key={item.video_id}>
                  {/* Thumbnail */}
                  <div
                    className="fts-thumbnail-wrap"
                    onClick={() => setPreviewItem(item)}
                    title="Bấm để xem ảnh phóng to"
                  >
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title || item.video_id}
                        className="fts-thumbnail-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="fts-thumbnail-placeholder">No preview</div>
                    )}
                    <span className="fts-video-badge">{item.video_id}</span>
                  </div>

                  {/* Content */}
                  <div className="fts-content-wrap">
                    <div className="fts-content-header">
                      <h3 className="fts-card-title">{item.title || item.video_id}</h3>
                      <span className="fts-score-badge" title="FTS Relevance Score">
                        Score: {(item.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Matched Headline */}
                    {item.matched_headline && (
                      <div
                        className="fts-matched-headline"
                        dangerouslySetInnerHTML={{ __html: `“…${item.matched_headline}…”` }}
                      />
                    )}

                    {/* Description preview */}
                    {item.description && (
                      <p className="fts-card-desc">{item.description}</p>
                    )}

                    {/* Metadata footer */}
                    {item.video_path && (
                      <div className="fts-card-meta">
                        <span>{item.video_path}</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="fts-pagination">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(offset - limit)}
                >
                  ← Trước
                </button>
                <span className="fts-pagination-info">
                  Trang {currentPage} / {totalPages}
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
          <div className="fts-empty-state">
            <div className="fts-empty-icon" aria-hidden="true">⌁</div>
            <h3>Không tìm thấy video phù hợp</h3>
            <p>
              Không tìm thấy đoạn hội thoại hoặc văn bản nào khớp với “{submittedQuery}”. Hãy thử tìm với từ khóa ngắn gọn hơn hoặc các từ đồng nghĩa.
            </p>
          </div>
        )}
      </section>

      {/* ── Thumbnail Lightbox ── */}
      {previewItem && (
        <div className="fts-lightbox-overlay" onClick={() => setPreviewItem(null)}>
          <div className="fts-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="fts-lightbox-close"
              onClick={() => setPreviewItem(null)}
              aria-label="Đóng"
            >
              ×
            </button>

            {previewItem.thumbnail_url ? (
              <img
                className="fts-lightbox-img"
                src={previewItem.thumbnail_url}
                alt={previewItem.title || previewItem.video_id}
              />
            ) : (
              <div className="fts-thumbnail-placeholder" style={{ width: 320, height: 180, background: '#21201d', borderRadius: 12 }}>
                Không có thumbnail
              </div>
            )}

            <div className="fts-lightbox-footer">
              <span className="fts-lightbox-video">{previewItem.video_id}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span className="fts-lightbox-title">{previewItem.title || 'Video'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FulltextSearchPage;
