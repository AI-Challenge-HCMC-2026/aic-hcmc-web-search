import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchCollectionTree,
  fetchVideoKeyframes,
  type VideoTreeNode,
  type CollectionTreeNode,
  type PaginatedKeyframesResponse,
} from '../../../services/api';
import './index.css';

const KEYFRAMES_PER_PAGE = 24;

const formatCount = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const formatTimestamp = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '—';
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${(wholeSeconds % 60).toString().padStart(2, '0')}`;
};

const getVideoLabel = (video: VideoTreeNode) => video.title?.trim() || video.name;

const getApiError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (error instanceof TypeError) return 'Không thể kết nối tới máy chủ dữ liệu nội bộ (kiểm tra kết nối URL hoặc CORS).';
  return fallback;
};

export const DatasetPage: React.FC = () => {
  const [collections, setCollections] = useState<CollectionTreeNode[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoTreeNode | null>(null);
  const [keyframes, setKeyframes] = useState<PaginatedKeyframesResponse | null>(null);
  const [search, setSearch] = useState('');
  const [keyframePage, setKeyframePage] = useState(1);
  const [keyframesReload, setKeyframesReload] = useState(0);
  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [isKeyframesLoading, setIsKeyframesLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [keyframesError, setKeyframesError] = useState<string | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  const loadTree = async (signal?: AbortSignal) => {
    setIsTreeLoading(true);
    setTreeError(null);

    try {
      const nextCollections = await fetchCollectionTree(undefined, signal);
      setCollections(nextCollections);
      setExpandedCollections(new Set(nextCollections.slice(0, 1).map((collection) => collection.id)));
      setSelectedVideo((current) => {
        const videos = nextCollections.flatMap((collection) => collection.children);
        return videos.find((video) => video.id === current?.id) ?? videos[0] ?? null;
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setTreeError(getApiError(error, 'Không thể tải thư viện dữ liệu.'));
    } finally {
      if (!signal?.aborted) setIsTreeLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => void loadTree(controller.signal));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;

    const controller = new AbortController();
    const loadKeyframes = async () => {
      setIsKeyframesLoading(true);
      setKeyframesError(null);

      try {
        const data = await fetchVideoKeyframes(
          selectedVideo.id,
          keyframePage,
          KEYFRAMES_PER_PAGE,
          controller.signal,
        );
        setKeyframes(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setKeyframesError(getApiError(error, 'Không thể tải keyframe.'));
      } finally {
        if (!controller.signal.aborted) setIsKeyframesLoading(false);
      }
    };

    void loadKeyframes();
    return () => controller.abort();
  }, [selectedVideo, keyframePage, keyframesReload]);

  const filteredCollections = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi-VN');
    if (!query) return collections;
    return collections
      .map((collection) => {
        const collectionMatches = collection.name.toLocaleLowerCase('vi-VN').includes(query);
        return {
          ...collection,
          children: collectionMatches
            ? collection.children
            : collection.children.filter((video) => `${video.name} ${video.title ?? ''}`.toLocaleLowerCase('vi-VN').includes(query)),
        };
      })
      .filter((collection) => collection.name.toLocaleLowerCase('vi-VN').includes(query) || collection.children.length > 0);
  }, [collections, search]);

  const totalVideos = collections.reduce((total, collection) => total + collection.total_videos, 0);
  const totalKeyframes = collections.reduce((total, collection) => total + collection.total_keyframes, 0);

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((current) => {
      const next = new Set(current);
      if (next.has(collectionId)) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
  };

  const selectVideo = (video: VideoTreeNode) => {
    setSelectedVideo(video);
    setKeyframePage(1);
  };

  return (
    <div className="dataset-container">
      <header className="dataset-header">
        <div className="dataset-heading-row"><span className="dataset-sparkle" aria-hidden="true">✻</span><h1 className="dataset-title">Dataset</h1></div>
        <p className="dataset-subtitle">Duyệt bộ sưu tập video và xem keyframe từ thư viện dữ liệu nội bộ.</p>
      </header>

      <div className="dataset-summary" aria-label="Dataset summary">
        <span><strong>{formatCount(collections.length)}</strong> collections</span><span className="dataset-summary-divider" />
        <span><strong>{formatCount(totalVideos)}</strong> videos</span><span className="dataset-summary-divider" />
        <span><strong>{formatCount(totalKeyframes)}</strong> keyframes</span>
      </div>

      <div className="dataset-workspace">
        <aside className="dataset-library" aria-label="Video library">
          <div className="dataset-library-header"><div><h2>Thư viện video</h2><span>{isTreeLoading ? 'Đang đồng bộ…' : `${formatCount(totalVideos)} video`}</span></div>
            <button type="button" className="dataset-icon-button" onClick={() => void loadTree()} disabled={isTreeLoading} aria-label="Làm mới thư viện" title="Làm mới thư viện">↻</button>
          </div>
          <label className="dataset-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm video hoặc collection…" aria-label="Tìm video hoặc collection" /></label>
          <div className="dataset-tree">
            {isTreeLoading && <div className="dataset-tree-message">Đang tải thư viện dữ liệu…</div>}
            {!isTreeLoading && treeError && <div className="dataset-tree-message dataset-error-message"><span>{treeError}</span><button type="button" onClick={() => void loadTree()}>Thử lại</button></div>}
            {!isTreeLoading && !treeError && filteredCollections.length === 0 && <div className="dataset-tree-message">Không tìm thấy video phù hợp.</div>}
            {!isTreeLoading && !treeError && filteredCollections.map((collection) => {
              const isExpanded = expandedCollections.has(collection.id);
              return <div className="dataset-collection" key={collection.id}>
                <button type="button" className="dataset-collection-row" onClick={() => toggleCollection(collection.id)}><span className={`dataset-chevron${isExpanded ? ' is-expanded' : ''}`} aria-hidden="true">›</span><span className="dataset-folder-icon" aria-hidden="true">▦</span><span className="dataset-collection-name" title={collection.name}>{collection.name}</span><span className="dataset-count">{formatCount(collection.total_videos)}</span></button>
                {isExpanded && <div className="dataset-video-list">{collection.children.map((video) => <button type="button" key={video.id} className={`dataset-video-row${selectedVideo?.id === video.id ? ' is-selected' : ''}`} onClick={() => selectVideo(video)} title={getVideoLabel(video)}><span className="dataset-video-indicator" aria-hidden="true" /><span className="dataset-video-name">{video.name}</span><span className="dataset-count">{formatCount(video.keyframe_count)}</span></button>)}</div>}
              </div>;
            })}
          </div>
        </aside>

        <main className="dataset-gallery" aria-live="polite">
          {selectedVideo ? <>
            <div className="dataset-gallery-header"><div className="dataset-gallery-heading"><span className="dataset-eyebrow">KEYFRAME GALLERY</span><h2>{selectedVideo.name}</h2><p title={getVideoLabel(selectedVideo)}>{getVideoLabel(selectedVideo)}</p></div><div className="dataset-video-meta"><span>{formatCount(selectedVideo.keyframe_count)} keyframes</span>{keyframes && <span>Trang {keyframes.page} / {keyframes.total_pages}</span>}</div></div>
            {isKeyframesLoading && <div className="dataset-keyframe-grid" aria-label="Đang tải keyframe">{Array.from({ length: 8 }, (_, index) => <div className="dataset-keyframe-skeleton" key={index} />)}</div>}
            {!isKeyframesLoading && keyframesError && <div className="dataset-empty-state dataset-error-state"><span className="dataset-empty-icon">!</span><h3>Không tải được keyframe</h3><p>{keyframesError}</p><button type="button" onClick={() => setKeyframesReload((value) => value + 1)}>Thử lại</button></div>}
            {!isKeyframesLoading && !keyframesError && keyframes && keyframes.items.length === 0 && <div className="dataset-empty-state"><span className="dataset-empty-icon">✻</span><h3>Chưa có keyframe</h3><p>Video này chưa có dữ liệu keyframe để hiển thị.</p></div>}
            {!isKeyframesLoading && !keyframesError && keyframes && keyframes.items.length > 0 && <><div className="dataset-keyframe-grid">{keyframes.items.map((keyframe) => <figure className="dataset-keyframe-card" key={keyframe.keyframe_id}><div className="dataset-keyframe-image-wrap">{keyframe.public_url ? <img src={keyframe.public_url} alt={`${selectedVideo.name} — ${keyframe.keyframe_name}`} loading="lazy" /> : <div className="dataset-image-missing">No preview</div>}<span className="dataset-frame-number">{keyframe.keyframe_name}</span></div><figcaption><span>Frame {keyframe.frame_idx ?? '—'}</span><span>{formatTimestamp(keyframe.timestamp_sec)}</span></figcaption></figure>)}</div><div className="dataset-pagination"><button type="button" onClick={() => setKeyframePage((page) => Math.max(1, page - 1))} disabled={!keyframes.has_prev || isKeyframesLoading}>← Trước</button><span>{formatCount(keyframes.items.length)} / {formatCount(keyframes.total_keyframes)} keyframes</span><button type="button" onClick={() => setKeyframePage((page) => page + 1)} disabled={!keyframes.has_next || isKeyframesLoading}>Sau →</button></div></>}
          </> : <div className="dataset-empty-state"><span className="dataset-empty-icon">✻</span><h3>Chọn một video</h3><p>Chọn video trong thư viện để bắt đầu xem keyframe.</p></div>}
        </main>
      </div>
    </div>
  );
};

export default DatasetPage;
