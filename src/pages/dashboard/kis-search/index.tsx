import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  searchFullText,
  searchByObjects,
  type FullTextSearchItem,
  type KeyframeItem,
} from '../../../services/api';
import { getGeminiConfig } from '../../../services/settings';
import './index.css';

const VIEW_LIMIT_OPTIONS = [12, 24, 48, 96];

const KIS_SUGGESTIONS = [
  'người đi xe máy trong thành phố mưa lớn',
  'xe cứu thương đỗ trước bệnh viện',
  'hai người đang phỏng vấn ngoài đường',
  'ô tô màu trắng chạy qua ngã tư có đèn giao thông',
  'người phụ nữ mặc áo xanh cầm ô',
];

type PipelineStage = 'idle' | 'fts' | 'objects' | 'done' | 'error';
type StageNavTab = 'all' | 'stage1' | 'stage2' | 'stage3';

interface VideoKeyframeGroup {
  video: FullTextSearchItem;
  keyframes: KeyframeItem[];
  extractedObjects: string[];
}

export const KisSearchPage: React.FC = () => {
  /* ── Inputs & Controls ── */
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [threshold, setThreshold] = useState(0.45);
  const [viewLimit, setViewLimit] = useState(24);

  /* ── Pipeline Execution State ── */
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [stageProgressText, setStageProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Stage 1 Data (Full-Text Search) ── */
  const [candidateVideos, setCandidateVideos] = useState<FullTextSearchItem[]>([]);
  const [ftsTotal, setFtsTotal] = useState(0);
  const [ftsTsquery, setFtsTsquery] = useState<string | null>(null);
  const [ftsEntities, setFtsEntities] = useState<string[]>([]);
  const [stage1Done, setStage1Done] = useState(false);

  /* ── Stage 2 Data (Objects Search) ── */
  const [videoGroups, setVideoGroups] = useState<VideoKeyframeGroup[]>([]);
  const [allExtractedObjects, setAllExtractedObjects] = useState<string[]>([]);
  const [stage2Done, setStage2Done] = useState(false);

  /* ── View Controls ── */
  const [activeTab, setActiveTab] = useState<StageNavTab>('all');
  const [stage2ViewMode, setStage2ViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [filterVideoId, setFilterVideoId] = useState<string>('all');
  const [flatPage, setFlatPage] = useState(1);
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set());

  /* ── Lightbox State ── */
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string;
    videoId: string;
    frameName: string;
    frameIdx?: number | null;
    timestampSec?: number | null;
    index: number;
    total: number;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  /* ── Flattened Keyframes for Flat View & Lightbox ── */
  const flatKeyframesList = useMemo(() => {
    const list: { keyframe: KeyframeItem; video: FullTextSearchItem }[] = [];
    for (const group of videoGroups) {
      if (filterVideoId !== 'all' && group.video.video_id !== filterVideoId) continue;
      for (const kf of group.keyframes) {
        list.push({ keyframe: kf, video: group.video });
      }
    }
    return list;
  }, [videoGroups, filterVideoId]);

  /* ── Paginated keyframes for Flat View ── */
  const paginatedFlatKeyframes = useMemo(() => {
    const start = (flatPage - 1) * viewLimit;
    return flatKeyframesList.slice(start, start + viewLimit);
  }, [flatKeyframesList, flatPage, viewLimit]);

  const totalFlatPages = Math.ceil(flatKeyframesList.length / viewLimit);

  /* ── Total Keyframe Count ── */
  const totalKeyframesCount = useMemo(
    () => videoGroups.reduce((acc, g) => acc + g.keyframes.length, 0),
    [videoGroups],
  );

  /* ── Reset flat page on filter change ── */
  useEffect(() => {
    setFlatPage(1);
  }, [filterVideoId, viewLimit]);

  /* ── Toggle video keyframe expansion in grouped view ── */
  const toggleExpandVideo = (vidId: string) => {
    setExpandedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(vidId)) next.delete(vidId);
      else next.add(vidId);
      return next;
    });
  };

  /* ── Pipeline Execution ── */
  const executeKisPipeline = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Reset states
      setStage('fts');
      setErrorMsg('');
      setSubmittedQuery(trimmed);
      setCandidateVideos([]);
      setFtsTotal(0);
      setFtsTsquery(null);
      setFtsEntities([]);
      setStage1Done(false);

      setVideoGroups([]);
      setAllExtractedObjects([]);
      setStage2Done(false);
      setFilterVideoId('all');
      setActiveTab('all');
      setFlatPage(1);
      setExpandedVideos(new Set());

      try {
        const geminiConfig = getGeminiConfig();

        /* ─── STAGE 1: Full-Text Search (Lấy TOÀN BỘ video tiềm năng từ CSDL) ─── */
        setStageProgressText('Giai đoạn 1: Đang thực hiện Full-Text Search trên toàn bộ kho video…');
        
        let allVideos: FullTextSearchItem[] = [];
        let ftsOffset = 0;
        const FTS_BATCH_SIZE = 100;
        let totalFtsCount = 0;

        do {
          const ftsResponse = await searchFullText(
            {
              query: trimmed,
              gemini_config: geminiConfig,
              limit: FTS_BATCH_SIZE,
              offset: ftsOffset,
            },
            controller.signal,
          );

          totalFtsCount = ftsResponse.total;
          setFtsTotal(totalFtsCount);
          setFtsTsquery(ftsResponse.optimized_tsquery);
          setFtsEntities(ftsResponse.extracted_entities ?? []);

          if (ftsResponse.items && ftsResponse.items.length > 0) {
            allVideos = allVideos.concat(ftsResponse.items);
            ftsOffset += ftsResponse.items.length;
            setCandidateVideos([...allVideos]);
          } else {
            break;
          }
        } while (ftsOffset < totalFtsCount && ftsOffset < 500); // Lấy toàn bộ video khớp

        setStage1Done(true);

        if (allVideos.length === 0) {
          setStage('done');
          setStageProgressText('Giai đoạn 1: Không tìm thấy video nào qua FTS.');
          return;
        }

        /* ─── STAGE 2: Objects Search (Lấy HẾT keyframes của TOÀN BỘ video) ─── */
        setStage('objects');
        setStageProgressText(`Giai đoạn 2: Bắt đầu quét toàn bộ keyframes qua ${allVideos.length} video tiềm năng…`);

        const groups: VideoKeyframeGroup[] = [];
        const extractedObjSet = new Set<string>();

        for (let i = 0; i < allVideos.length; i++) {
          const video = allVideos[i];
          setStageProgressText(
            `Giai đoạn 2: Đang quét toàn bộ keyframes video ${i + 1}/${allVideos.length} (${video.video_id})…`,
          );

          try {
            // Lấy TOÀN BỘ keyframes khớp đối tượng cho video này (phân trang tới khi hết)
            let videoKeyframes: KeyframeItem[] = [];
            let kfOffset = 0;
            const KF_BATCH_SIZE = 100;
            let kfTotal = 0;

            do {
              const objRes = await searchByObjects(
                {
                  video_id: video.video_id,
                  query: trimmed,
                  gemini_config: geminiConfig,
                  threshold,
                  limit: KF_BATCH_SIZE,
                  offset: kfOffset,
                },
                controller.signal,
              );

              kfTotal = objRes.total;
              objRes.extracted_objects?.forEach((o) => extractedObjSet.add(o));

              if (objRes.items && objRes.items.length > 0) {
                videoKeyframes = videoKeyframes.concat(objRes.items);
                kfOffset += objRes.items.length;
              } else {
                break;
              }
            } while (kfOffset < kfTotal);

            const newGroup: VideoKeyframeGroup = {
              video,
              keyframes: videoKeyframes,
              extractedObjects: Array.from(extractedObjSet),
            };

            groups.push(newGroup);
            setVideoGroups([...groups]);
            setAllExtractedObjects(Array.from(extractedObjSet));
          } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            const emptyGroup: VideoKeyframeGroup = {
              video,
              keyframes: [],
              extractedObjects: [],
            };
            groups.push(emptyGroup);
            setVideoGroups([...groups]);
          }
        }

        setStage2Done(true);
        setStage('done');
        setStageProgressText('Đã hoàn tất Giai đoạn 1 & Giai đoạn 2 của KIS Pipeline!');
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setStage('error');
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định khi chạy KIS Pipeline.');
      }
    },
    [threshold],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeKisPipeline(query);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    setTimeout(() => executeKisPipeline(s), 0);
  };

  /* ── Lightbox keyboard shortcuts ── */
  useEffect(() => {
    if (!lightboxData) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxData(null);
      } else if (e.key === 'ArrowRight' && lightboxData.index < lightboxData.total - 1) {
        const nextIdx = lightboxData.index + 1;
        const nextItem = flatKeyframesList[nextIdx];
        if (nextItem) {
          setLightboxData({
            imageUrl: nextItem.keyframe.public_url ?? '',
            videoId: nextItem.video.video_id,
            frameName: nextItem.keyframe.keyframe_name,
            frameIdx: nextItem.keyframe.frame_idx,
            timestampSec: nextItem.keyframe.timestamp_sec,
            index: nextIdx,
            total: flatKeyframesList.length,
          });
        }
      } else if (e.key === 'ArrowLeft' && lightboxData.index > 0) {
        const prevIdx = lightboxData.index - 1;
        const prevItem = flatKeyframesList[prevIdx];
        if (prevItem) {
          setLightboxData({
            imageUrl: prevItem.keyframe.public_url ?? '',
            videoId: prevItem.video.video_id,
            frameName: prevItem.keyframe.keyframe_name,
            frameIdx: prevItem.keyframe.frame_idx,
            timestampSec: prevItem.keyframe.timestamp_sec,
            index: prevIdx,
            total: flatKeyframesList.length,
          });
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [lightboxData, flatKeyframesList]);

  const openLightbox = (
    item: KeyframeItem,
    video: FullTextSearchItem,
    index: number,
    total: number,
  ) => {
    setLightboxData({
      imageUrl: item.public_url ?? '',
      videoId: video.video_id,
      frameName: item.keyframe_name,
      frameIdx: item.frame_idx,
      timestampSec: item.timestamp_sec,
      index,
      total,
    });
  };

  const openVideoThumbnailLightbox = (video: FullTextSearchItem) => {
    if (!video.thumbnail_url) return;
    setLightboxData({
      imageUrl: video.thumbnail_url,
      videoId: video.video_id,
      frameName: video.title || 'Thumbnail video',
      index: 0,
      total: 1,
    });
  };

  const formatTimestamp = (sec: number | null) => {
    if (sec == null) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const canSubmit = query.trim().length >= 2;

  return (
    <div className="kis-page-container">
      {/* ── Header ── */}
      <header className="kis-header">
        <div className="kis-title-row">
          <span className="kis-sparkle" aria-hidden="true">✻</span>
          <h1>KIS Search Pipeline</h1>
        </div>
        <p className="kis-subtitle">
          Known-Item Search đa tầng: Kết hợp Full-Text Search (FTS) ➔ Objects Detection ➔ Visual Verification.
        </p>
      </header>

      {/* ── Pipeline Stepper ── */}
      <section className="kis-stepper-card" aria-label="KIS Multi-stage Pipeline Stepper">
        <div className="kis-stepper-header">
          <span className="kis-stepper-label">TIẾN TRÌNH THỰC THI PIPELINE</span>
          <span className="kis-stepper-progress">
            {stage === 'idle' && 'Chờ bắt đầu'}
            {stage === 'fts' && 'Đang chạy Giai đoạn 1/3 (FTS)'}
            {stage === 'objects' && 'Đang chạy Giai đoạn 2/3 (Objects)'}
            {stage === 'done' && '✓ Đã hoàn thành Giai đoạn 1 & 2'}
            {stage === 'error' && 'Lỗi Pipeline'}
          </span>
        </div>

        <div className="kis-pipeline-steps">
          {/* Step 1: FTS */}
          <div
            className={`kis-step-item ${
              stage === 'fts'
                ? 'active'
                : stage1Done
                ? 'completed'
                : 'pending'
            }`}
          >
            <div className="kis-step-icon">
              {stage1Done ? '✓' : '1'}
            </div>
            <div className="kis-step-meta">
              <span className="kis-step-title">1. Full-Text Search</span>
              <span className="kis-step-desc">
                {stage1Done
                  ? `Lấy toàn bộ ${candidateVideos.length} video`
                  : 'Lọc video tiềm năng'}
              </span>
            </div>
          </div>

          <span className="kis-step-arrow" aria-hidden="true">→</span>

          {/* Step 2: Objects Search */}
          <div
            className={`kis-step-item ${
              stage === 'objects'
                ? 'active'
                : stage2Done
                ? 'completed'
                : 'pending'
            }`}
          >
            <div className="kis-step-icon">
              {stage2Done ? '✓' : '2'}
            </div>
            <div className="kis-step-meta">
              <span className="kis-step-title">2. Objects Search</span>
              <span className="kis-step-desc">
                {stage2Done
                  ? `Lấy hết ${totalKeyframesCount} keyframes`
                  : stage === 'objects'
                  ? 'Đang quét keyframes…'
                  : 'Khoanh vùng keyframes'}
              </span>
            </div>
          </div>

          <span className="kis-step-arrow" aria-hidden="true">→</span>

          {/* Step 3: Visual Verification */}
          <div className="kis-step-item pending">
            <div className="kis-step-icon">3</div>
            <div className="kis-step-meta">
              <span className="kis-step-title">3. VLM Verification</span>
              <span className="kis-step-desc">Đang phát triển backend</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Command Card ── */}
      <section className="kis-command-card" aria-label="KIS Search command bar">
        <div className="kis-command-intro">
          <span className="kis-command-label">KIS QUERY PIPELINE</span>
          <span>Nhập mô tả cảnh. Toàn bộ video và 100% keyframes khớp sẽ được thu thập đầy đủ.</span>
        </div>

        <form className="kis-command-form" onSubmit={handleSubmit}>
          <div className="kis-input-wrap">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mô tả chi tiết cảnh KIS cần tìm (VD: người đi xe máy trong thành phố mưa lớn)…"
              aria-label="KIS query"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="kis-clear-button"
                onClick={() => setQuery('')}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>

          <div className="kis-command-controls">
            <div className="kis-filter-list">
              {/* Object Detection Threshold */}
              <label className="kis-filter">
                <span>Ngưỡng Object</span>
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
                  aria-label="Object Threshold"
                  className="kis-threshold-input"
                />
              </label>

              {/* View limit on UI */}
              <label className="kis-filter">
                <span>Hiển thị UI</span>
                <select
                  value={viewLimit}
                  onChange={(e) => setViewLimit(Number(e.target.value))}
                  aria-label="Hiển thị tối đa frame trên UI"
                >
                  {VIEW_LIMIT_OPTIONS.map((num) => (
                    <option value={num} key={num}>
                      {num} frame / view
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
              isLoading={stage === 'fts' || stage === 'objects'}
            >
              Chạy Toàn Bộ Pipeline
            </Button>
          </div>
        </form>
      </section>

      {/* ── Idle State (Before any search) ── */}
      {stage === 'idle' && (
        <section className="kis-stage-section">
          <div className="kis-empty-state">
            <div className="kis-empty-icon" aria-hidden="true">✻</div>
            <h3>Bắt đầu truy vấn Known-Item Search</h3>
            <p>
              Nhập mô tả tình huống hoặc từ khóa. Pipeline sẽ tự động thực hiện Full-Text Search lấy toàn bộ video tiềm năng, sau đó trích xuất 100% keyframes chứa đối tượng tương ứng.
            </p>
            <div className="kis-suggestions">
              {KIS_SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => handleSuggestion(s)}>
                  {s}
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="kis-preview-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Error State ── */}
      {stage === 'error' && (
        <section className="kis-stage-section">
          <div className="kis-empty-state">
            <div className="kis-empty-icon" aria-hidden="true" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.12)' }}>!</div>
            <h3>Lỗi trong quá trình chạy KIS Pipeline</h3>
            <p>{errorMsg}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => executeKisPipeline(submittedQuery || query)}
            >
              Thử lại
            </Button>
          </div>
        </section>
      )}

      {/* ── Multi-Stage Results Navigation Tabs (Khi đã bắt đầu chạy) ── */}
      {stage !== 'idle' && stage !== 'error' && (
        <>
          <div className="kis-stage-nav-bar">
            <div className="kis-nav-tabs">
              <button
                type="button"
                className={`kis-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả các Stage (Dòng chảy)
              </button>
              <button
                type="button"
                className={`kis-nav-tab ${activeTab === 'stage1' ? 'active' : ''}`}
                onClick={() => setActiveTab('stage1')}
              >
                1. FTS ({candidateVideos.length} video)
              </button>
              <button
                type="button"
                className={`kis-nav-tab ${activeTab === 'stage2' ? 'active' : ''}`}
                onClick={() => setActiveTab('stage2')}
              >
                2. Objects ({totalKeyframesCount} keyframes)
              </button>
              <button
                type="button"
                className={`kis-nav-tab ${activeTab === 'stage3' ? 'active' : ''}`}
                onClick={() => setActiveTab('stage3')}
              >
                3. Verification (VLM)
              </button>
            </div>
          </div>

          {/* =================================================================
              STAGE 1: FULL-TEXT SEARCH RESULTS (LẤY TRỌN VẸN TOÀN BỘ VIDEO)
              ================================================================= */}
          {(activeTab === 'all' || activeTab === 'stage1') && (
            <section className="kis-stage-section">
              <div className="kis-stage-header">
                <div className="kis-stage-title-wrap">
                  <span className="kis-stage-eyebrow">STAGE 1 RESULT</span>
                  <h2>Full-Text Search — Video tiềm năng ({candidateVideos.length})</h2>
                </div>
                <span
                  className={`kis-stage-status-badge ${
                    stage === 'fts'
                      ? 'loading'
                      : stage1Done
                      ? 'completed'
                      : 'pending'
                  }`}
                >
                  <i />
                  {stage === 'fts'
                    ? 'Đang truy vấn FTS…'
                    : stage1Done
                    ? `✓ Hoàn thành (${candidateVideos.length} video)`
                    : 'Chờ'}
                </span>
              </div>

              {/* Stage 1 Loading */}
              {stage === 'fts' && (
                <div className="kis-skeleton-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div className="kis-skeleton-item" key={i}>
                      <div className="kis-skeleton-img" />
                      <div className="kis-skeleton-meta">
                        <div className="kis-skeleton-line" />
                        <div className="kis-skeleton-line short" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stage 1 Completed Content */}
              {stage1Done && (
                <>
                  <div className="kis-stage1-meta">
                    <span>
                      Tổng khớp CSDL: <strong>{ftsTotal}</strong> video
                    </span>
                    <span>
                      Đã lấy & chuyển tiếp vào Stage 2: <strong>Toàn bộ {candidateVideos.length} video</strong>
                    </span>
                    {ftsTsquery && (
                      <span>
                        tsquery: <code style={{ color: 'var(--accent-terracotta)', background: 'var(--accent-terracotta-subtle)', padding: '1px 6px', borderRadius: 4 }}>{ftsTsquery}</code>
                      </span>
                    )}
                    {ftsEntities.length > 0 && (
                      <span>
                        Thực thể: {ftsEntities.map((ent) => (
                          <code key={ent} style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', padding: '1px 6px', borderRadius: 4, marginRight: 4 }}>{ent}</code>
                        ))}
                      </span>
                    )}
                  </div>

                  {candidateVideos.length > 0 ? (
                    <div className="kis-stage1-videos-grid">
                      {candidateVideos.map((video) => (
                        <div className="kis-candidate-video-card" key={video.video_id}>
                          <div
                            className="kis-cand-thumb"
                            onClick={() => openVideoThumbnailLightbox(video)}
                            title="Xem ảnh thumbnail"
                          >
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt={video.video_id} loading="lazy" />
                            ) : (
                              <div className="kis-cand-thumb-placeholder">No preview</div>
                            )}
                          </div>

                          <div className="kis-cand-body">
                            <div className="kis-cand-header">
                              <span className="kis-cand-id">{video.video_id}</span>
                              <span className="kis-cand-score">
                                Score: {(video.score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <h4 className="kis-cand-title" title={video.title || video.video_id}>
                              {video.title || video.video_id}
                            </h4>
                            {video.matched_headline && (
                              <div
                                className="kis-cand-snippet"
                                dangerouslySetInnerHTML={{ __html: `“…${video.matched_headline}…”` }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="kis-no-keyframes-msg">
                      Không tìm thấy video nào qua Full-Text Search.
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* =================================================================
              STAGE 2: OBJECTS SEARCH RESULTS (LẤY HẾT TOÀN BỘ KEYFRAMES)
              ================================================================= */}
          {(activeTab === 'all' || activeTab === 'stage2') && (
            <section className="kis-stage-section">
              <div className="kis-stage-header">
                <div className="kis-stage-title-wrap">
                  <span className="kis-stage-eyebrow">STAGE 2 RESULT</span>
                  <h2>Objects Search — Toàn bộ keyframes khoanh vùng ({totalKeyframesCount})</h2>
                </div>
                <span
                  className={`kis-stage-status-badge ${
                    stage === 'objects'
                      ? 'loading'
                      : stage2Done
                      ? 'completed'
                      : 'pending'
                  }`}
                >
                  <i />
                  {stage === 'objects'
                    ? stageProgressText
                    : stage2Done
                    ? `✓ Hoàn thành (${totalKeyframesCount} keyframes)`
                    : 'Chờ Stage 1'}
                </span>
              </div>

              {/* Stage 2 Summary & Controls */}
              {(stage === 'objects' || stage2Done) && (
                <>
                  <div className="kis-stage2-summary">
                    <div className="kis-stage2-metrics">
                      <span>
                        Ngưỡng phát hiện: <strong>≥ {threshold}</strong>
                      </span>
                      <span>
                        Tổng keyframes thu thập: <strong>{totalKeyframesCount}</strong> (lấy hết 100% keyframes)
                      </span>
                    </div>

                    {allExtractedObjects.length > 0 && (
                      <div className="kis-extracted-objects-row">
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Vật thể Gemini trích xuất:
                        </span>
                        {allExtractedObjects.map((obj) => (
                          <span className="kis-obj-chip" key={obj}>
                            {obj}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* View Mode Switcher */}
                  {totalKeyframesCount > 0 && (
                    <div className="kis-stage2-view-controls">
                      <div className="kis-stage2-view-tabs">
                        <button
                          type="button"
                          className={`kis-stage2-view-tab ${stage2ViewMode === 'grouped' ? 'active' : ''}`}
                          onClick={() => setStage2ViewMode('grouped')}
                        >
                          Nhóm theo Video ({videoGroups.length})
                        </button>
                        <button
                          type="button"
                          className={`kis-stage2-view-tab ${stage2ViewMode === 'flat' ? 'active' : ''}`}
                          onClick={() => setStage2ViewMode('flat')}
                        >
                          Lưới toàn bộ Keyframes ({flatKeyframesList.length})
                        </button>
                      </div>

                      {stage2ViewMode === 'flat' && candidateVideos.length > 1 && (
                        <select
                          value={filterVideoId}
                          onChange={(e) => setFilterVideoId(e.target.value)}
                          className="kis-video-filter-select"
                          aria-label="Filter keyframes by video"
                        >
                          <option value="all">Tất cả video ({candidateVideos.length})</option>
                          {candidateVideos.map((v) => (
                            <option value={v.video_id} key={v.video_id}>
                              {v.video_id} — {v.title ? v.title.slice(0, 30) + '…' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Grouped View */}
                  {stage2ViewMode === 'grouped' && (
                    <div className="kis-video-groups-list">
                      {videoGroups.map((group) => {
                        const video = group.video;
                        const keyframes = group.keyframes;
                        const isExpanded = expandedVideos.has(video.video_id);
                        const displayedKeyframes = isExpanded
                          ? keyframes
                          : keyframes.slice(0, viewLimit);
                        const hasMore = keyframes.length > viewLimit;

                        return (
                          <div className="kis-group-card" key={video.video_id}>
                            <div className="kis-group-card-header">
                              <div className="kis-group-card-title-wrap">
                                <div className="kis-group-card-title-row">
                                  <span className="kis-group-video-id">{video.video_id}</span>
                                  <h4 style={{ fontSize: 13, margin: 0, color: 'var(--text-primary)' }}>
                                    {video.title || video.video_id}
                                  </h4>
                                </div>
                              </div>
                              <span className="kis-group-badge">
                                {keyframes.length} keyframes (lấy hết)
                              </span>
                            </div>

                            {keyframes.length > 0 ? (
                              <>
                                <div className="kis-group-kf-grid">
                                  {displayedKeyframes.map((kf, kfIdx) => (
                                    <div
                                      className="kis-kf-item"
                                      key={kf.keyframe_id}
                                      onClick={() => openLightbox(kf, video, kfIdx, keyframes.length)}
                                      title="Phóng to keyframe"
                                    >
                                      <img
                                        src={kf.public_url ?? ''}
                                        alt={`${kf.video_id} - ${kf.keyframe_name}`}
                                        loading="lazy"
                                      />
                                      <span className="kis-kf-badge">
                                        Frame #{kf.frame_idx ?? '—'}
                                      </span>
                                      <div className="kis-kf-meta">
                                        <span className="kis-kf-video">{kf.video_id}</span>
                                        <span className="kis-kf-frame">
                                          Frame {kf.frame_idx ?? '—'} · {kf.keyframe_name}
                                          {kf.timestamp_sec != null && ` · ${formatTimestamp(kf.timestamp_sec)}`}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {hasMore && (
                                  <button
                                    type="button"
                                    className="kis-expand-btn"
                                    onClick={() => toggleExpandVideo(video.video_id)}
                                  >
                                    {isExpanded
                                      ? `Thu gọn (hiển thị ${viewLimit} frame)`
                                      : `+ Xem thêm ${keyframes.length - viewLimit} keyframe còn lại`}
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="kis-no-keyframes-msg">
                                Không tìm thấy keyframe nào chứa đủ vật thể yêu cầu với threshold ≥ {threshold}.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Flat Gallery View */}
                  {stage2ViewMode === 'flat' && (
                    <>
                      <div className="kis-flat-kf-grid">
                        {paginatedFlatKeyframes.map(({ keyframe: kf, video }, idx) => {
                          const globalIdx = (flatPage - 1) * viewLimit + idx;
                          return (
                            <div
                              className="kis-kf-item"
                              key={`${video.video_id}-${kf.keyframe_id}`}
                              onClick={() => openLightbox(kf, video, globalIdx, flatKeyframesList.length)}
                              title="Phóng to keyframe"
                            >
                              <img
                                src={kf.public_url ?? ''}
                                alt={`${kf.video_id} - ${kf.keyframe_name}`}
                                loading="lazy"
                              />
                              <span className="kis-kf-badge">
                                Frame #{kf.frame_idx ?? '—'}
                              </span>
                              <div className="kis-kf-meta">
                                <span className="kis-kf-video">{kf.video_id}</span>
                                <span className="kis-kf-frame">
                                  Frame {kf.frame_idx ?? '—'} · {kf.keyframe_name}
                                  {kf.timestamp_sec != null && ` · ${formatTimestamp(kf.timestamp_sec)}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination for Flat View */}
                      {totalFlatPages > 1 && (
                        <div className="kis-stage2-pagination">
                          <button
                            type="button"
                            disabled={flatPage <= 1}
                            onClick={() => setFlatPage((p) => Math.max(1, p - 1))}
                          >
                            ← Trước
                          </button>
                          <span className="kis-stage2-pagination-info">
                            Trang {flatPage} / {totalFlatPages} ({flatKeyframesList.length} keyframes)
                          </span>
                          <button
                            type="button"
                            disabled={flatPage >= totalFlatPages}
                            onClick={() => setFlatPage((p) => Math.min(totalFlatPages, p + 1))}
                          >
                            Sau →
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Stage 2 zero keyframes */}
                  {stage2Done && totalKeyframesCount === 0 && (
                    <div className="kis-no-keyframes-msg" style={{ padding: '30px 16px', fontSize: 13 }}>
                      Đã quét qua toàn bộ {candidateVideos.length} video nhưng không có keyframe nào thỏa mãn threshold ≥ {threshold}. Hãy thử hạ threshold.
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* =================================================================
              STAGE 3: VLM KEY-FRAME VERIFICATION (SẮP RA MẮT / PREVIEW CARD)
              ================================================================= */}
          {(activeTab === 'all' || activeTab === 'stage3') && (
            <section className="kis-stage-section">
              <div className="kis-stage-header">
                <div className="kis-stage-title-wrap">
                  <span className="kis-stage-eyebrow">STAGE 3 PIPELINE</span>
                  <h2>VLM Key-frames Verification — Xác thực thị giác</h2>
                </div>
                <span className="kis-stage-status-badge pending">
                  <i /> Đang phát triển backend
                </span>
              </div>

              <div className="kis-stage3-card">
                <div className="kis-stage3-icon">3</div>
                <div className="kis-stage3-content">
                  <h3>Xác thực trực quan bằng mô hình Vision-Language (VLM)</h3>
                  <p>
                    Sau khi {totalKeyframesCount} keyframes được khoanh vùng từ Stage 2, giai đoạn 3 sẽ đưa từng keyframe qua mô hình VLM (Qwen2-VL / GPT-4o) để kiểm tra chi tiết bối cảnh, hành động và loại bỏ các trường hợp nhận diện sai.
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Lightbox Modal ── */}
      {lightboxData && (
        <div className="kis-lightbox-overlay" onClick={() => setLightboxData(null)}>
          <div className="kis-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="kis-lightbox-close"
              onClick={() => setLightboxData(null)}
              aria-label="Đóng"
            >
              ×
            </button>

            {/* Prev Arrow */}
            {lightboxData.total > 1 && (
              <button
                className="kis-lightbox-arrow kis-lightbox-prev"
                disabled={lightboxData.index === 0}
                onClick={() => {
                  const prevIdx = lightboxData.index - 1;
                  const prevItem = flatKeyframesList[prevIdx];
                  if (prevItem) {
                    setLightboxData({
                      imageUrl: prevItem.keyframe.public_url ?? '',
                      videoId: prevItem.video.video_id,
                      frameName: prevItem.keyframe.keyframe_name,
                      frameIdx: prevItem.keyframe.frame_idx,
                      timestampSec: prevItem.keyframe.timestamp_sec,
                      index: prevIdx,
                      total: flatKeyframesList.length,
                    });
                  }
                }}
                aria-label="Ảnh trước"
              >
                ‹
              </button>
            )}

            {/* Main Lightbox Image */}
            <img
              className="kis-lightbox-img"
              src={lightboxData.imageUrl}
              alt={`${lightboxData.videoId} — ${lightboxData.frameName}`}
            />

            {/* Next Arrow */}
            {lightboxData.total > 1 && (
              <button
                className="kis-lightbox-arrow kis-lightbox-next"
                disabled={lightboxData.index === lightboxData.total - 1}
                onClick={() => {
                  const nextIdx = lightboxData.index + 1;
                  const nextItem = flatKeyframesList[nextIdx];
                  if (nextItem) {
                    setLightboxData({
                      imageUrl: nextItem.keyframe.public_url ?? '',
                      videoId: nextItem.video.video_id,
                      frameName: nextItem.keyframe.keyframe_name,
                      frameIdx: nextItem.keyframe.frame_idx,
                      timestampSec: nextItem.keyframe.timestamp_sec,
                      index: nextIdx,
                      total: flatKeyframesList.length,
                    });
                  }
                }}
                aria-label="Ảnh sau"
              >
                ›
              </button>
            )}

            {/* Footer Metadata */}
            <div className="kis-lightbox-footer">
              <span className="kis-lightbox-video">{lightboxData.videoId}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span className="kis-lightbox-frame">{lightboxData.frameName}</span>
              {lightboxData.frameIdx != null && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="kis-lightbox-frame">Frame #{lightboxData.frameIdx}</span>
                </>
              )}
              {lightboxData.timestampSec != null && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="kis-lightbox-frame">
                    {formatTimestamp(lightboxData.timestampSec)}
                  </span>
                </>
              )}
              {lightboxData.total > 1 && (
                <span className="kis-lightbox-counter">
                  {lightboxData.index + 1} / {lightboxData.total}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KisSearchPage;
