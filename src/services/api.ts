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

export interface GeminiConfig {
  api_key?: string | null;
  model?: string;
  base_url?: string | null;
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
 * Search keyframes by objects extracted from query within a specific video (POST).
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
 * Execute weighted PostgreSQL Full-Text Search across video transcripts,
 * title, description, and keywords.
 */
export async function searchFullText(
  body: FullTextSearchRequest,
  signal?: AbortSignal,
): Promise<FullTextSearchResponse> {
  const res = await fetch(`${API_BASE_URL}/search/full-text-search`, {
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
  const res = await fetch(`${API_BASE_URL}/search/kis-search`, {
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
