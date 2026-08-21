/**
 * API client utility for AIC HCMC Search Engine.
 *
 * Uses the native fetch API. Base URL is read from the VITE_API_BASE_URL
 * environment variable defined in .env.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

/* ─── Shared Types ─── */

export interface KeyframeItem {
  keyframe_id: number;
  video_id: string;
  keyframe_name: string;
  frame_idx: number | null;
  timestamp_sec: number | null;
  image_path: string;
  public_url: string | null;
}

/* ─── Object Search Types ─── */

export interface GeminiConfig {
  api_key?: string | null;
  model?: string;
  base_url?: string | null;
}

export interface MultiObjectSearchRequest {
  video_id: string;
  query: string;
  gemini_config?: GeminiConfig | null;
  threshold?: number;
  limit?: number;
  offset?: number;
}

export interface MultiObjectSearchResponse {
  video_id: string;
  query: string;
  extracted_objects: string[];
  total: number;
  limit: number;
  offset: number;
  items: KeyframeItem[];
}

/* ─── Object Vocabulary Types ─── */

export interface VocabularyItem {
  class_name: string;
  class_entity: string;
}

/* ─── Tree Types ─── */

export interface VideoTreeNode {
  id: string;
  name: string;
  type: 'video';
  title?: string | null;
  video_path?: string | null;
  thumbnail_url?: string | null;
  keyframe_count: number;
}

export interface CollectionTreeNode {
  id: string;
  name: string;
  type: 'collection';
  total_videos: number;
  total_keyframes: number;
  children: VideoTreeNode[];
}

/* ─── API Functions ─── */

/**
 * Search the object vocabulary whitelist by substring.
 */
export async function fetchObjectVocabulary(
  query?: string,
  limit: number = 50,
  signal?: AbortSignal,
): Promise<VocabularyItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set('query', query);

  const res = await fetch(`${API_BASE_URL}/keyframes/objects/vocabulary?${params}`, { signal });
  if (!res.ok) throw new Error(`Vocabulary request failed: ${res.status}`);
  return res.json();
}

/**
 * Search keyframes by objects extracted from a natural language query
 * within a specific video (POST). Gemini auto-extracts object entities.
 */
export async function searchByObjects(
  body: MultiObjectSearchRequest,
  signal?: AbortSignal,
): Promise<MultiObjectSearchResponse> {
  const res = await fetch(`${API_BASE_URL}/keyframes/search-by-objects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Object search request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch the collection / video directory tree.
 */
export async function fetchCollectionTree(
  videoLimit?: number,
  signal?: AbortSignal,
): Promise<CollectionTreeNode[]> {
  const params = new URLSearchParams();
  if (videoLimit !== undefined) params.set('video_limit', String(videoLimit));

  const res = await fetch(`${API_BASE_URL}/tree?${params}`, { signal });
  if (!res.ok) throw new Error(`Tree request failed: ${res.status}`);
  return res.json();
}

