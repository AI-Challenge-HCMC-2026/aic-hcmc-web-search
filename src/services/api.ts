/**
 * API client utility for AIC HCMC Search Engine.
 *
 * Uses the native fetch API. Base URL is dynamically retrieved from
 * user settings in localStorage (fallback to VITE_API_BASE_URL defined in .env).
 */
import { getBackendBaseUrl } from './settings';

/**
 * Universal fetch wrapper that automatically injects headers such as
 * `ngrok-skip-browser-warning: 69420` to bypass ngrok's interstitial page
 * and prevent CORS block issues when tunneling.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', '69420');
  }
  if (!headers.has('Content-Type') && (init?.method === 'POST' || init?.method === 'PUT' || init?.method === 'PATCH')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

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

export interface GeminiConfig {
  api_key?: string | null;
  model?: string;
  base_url?: string | null;
}

/* ─── Tree & Keyframes Types ─── */

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

export interface PaginatedKeyframesResponse {
  video_id: string;
  total_keyframes: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  items: KeyframeItem[];
}

/* ─── Object Search Types ─── */

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

export interface VocabularyItem {
  class_name: string;
  class_entity: string;
}

/* ─── Full-Text Search Types ─── */

export interface FullTextSearchItem {
  video_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_path: string | null;
  score: number;
  matched_headline: string | null;
}

export interface FullTextSearchRequest {
  query: string;
  gemini_config?: GeminiConfig | null;
  limit?: number;
  offset?: number;
}

export interface FullTextSearchResponse {
  total: number;
  limit: number;
  offset: number;
  query: string;
  optimized_tsquery: string | null;
  extracted_entities: string[] | null;
  items: FullTextSearchItem[];
}

/* ─── KIS Verification Types ─── */

export interface VLMConfig {
  base_url: string;
  api_key?: string;
  model: string;
  temperature?: number;
  max_concurrency?: number;
  timeout_seconds?: number;
}

export interface VerifiedKeyframeItem {
  keyframe_id: number;
  video_id: string;
  image_url: string | null;
  is_matched: boolean;
  confidence: number;
  reason: string;
}

export interface KISSearchRequest {
  query: string;
  vlm_config: VLMConfig;
  candidate_keyframe_ids?: number[] | null;
  video_id?: string | null;
  min_confidence?: number;
  limit?: number;
  offset?: number;
}

export interface KISSearchResponse {
  total_candidates: number;
  total_matched: number;
  limit: number;
  offset: number;
  items: VerifiedKeyframeItem[];
}

/* ─── API Functions ─── */

/**
 * Fetch the dataset collection & video tree hierarchy.
 */
export async function fetchCollectionTree(
  videoLimit?: number,
  signal?: AbortSignal,
): Promise<CollectionTreeNode[]> {
  const baseUrl = getBackendBaseUrl();
  const params = new URLSearchParams();
  if (videoLimit !== undefined) params.set('video_limit', String(videoLimit));

  const res = await apiFetch(`${baseUrl}/tree?${params}`, { signal });
  if (!res.ok) throw new Error(`Không thể tải thư viện dữ liệu (${res.status}).`);
  return res.json();
}

/**
 * List paginated keyframes for a specific video.
 */
export async function fetchVideoKeyframes(
  videoId: string,
  page: number = 1,
  limit: number = 24,
  signal?: AbortSignal,
): Promise<PaginatedKeyframesResponse> {
  const baseUrl = getBackendBaseUrl();
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await apiFetch(`${baseUrl}/videos/${encodeURIComponent(videoId)}/keyframes?${params}`, { signal });
  if (!res.ok) throw new Error(`Không thể tải keyframe (${res.status}).`);
  return res.json();
}

/**
 * Search the object vocabulary whitelist by substring.
 */
export async function fetchObjectVocabulary(
  query?: string,
  limit: number = 50,
  signal?: AbortSignal,
): Promise<VocabularyItem[]> {
  const baseUrl = getBackendBaseUrl();
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set('query', query);

  const res = await apiFetch(`${baseUrl}/keyframes/objects/vocabulary?${params}`, { signal });
  if (!res.ok) throw new Error(`Vocabulary request failed: ${res.status}`);
  return res.json();
}

/**
 * Search keyframes by objects extracted from query within a specific video (POST).
 */
export async function searchByObjects(
  body: MultiObjectSearchRequest,
  signal?: AbortSignal,
): Promise<MultiObjectSearchResponse> {
  const baseUrl = getBackendBaseUrl();
  const res = await apiFetch(`${baseUrl}/keyframes/search-by-objects`, {
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
 * Execute weighted PostgreSQL Full-Text Search across video transcripts,
 * title, description, and keywords.
 */
export async function searchFullText(
  body: FullTextSearchRequest,
  signal?: AbortSignal,
): Promise<FullTextSearchResponse> {
  const baseUrl = getBackendBaseUrl();
  const res = await apiFetch(`${baseUrl}/search/full-text-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Full-text search request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Known-Item Search (KIS) visual verification with VLM.
 */
export async function searchKisVerification(
  body: KISSearchRequest,
  signal?: AbortSignal,
): Promise<KISSearchResponse> {
  const baseUrl = getBackendBaseUrl();
  const res = await apiFetch(`${baseUrl}/search/kis-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `KIS verification request failed: ${res.status}`);
  }
  return res.json();
}
