import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  batchImportKisQueries,
  deleteKisQuery,
  exportKisSubmissionText,
  fetchKisQueries,
  fetchKisQueryDetail,
  importKisResults,
  type KisQueryDetailResponse,
  type KisQueryItemCreate,
  type KisQueryResponse,
} from '../../../../services/submissionKisApi';
import './KisSubmissionPage.css';

export const KisSubmissionPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member';
  const currentUserEmail = user?.email || undefined;

  const [queries, setQueries] = useState<KisQueryResponse[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null);
  const [selectedQueryDetail, setSelectedQueryDetail] = useState<KisQueryDetailResponse | null>(null);
  const [search, setSearch] = useState('');
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUploadingQueries, setIsUploadingQueries] = useState(false);
  const [isSubmittingResults, setIsSubmittingResults] = useState(false);
  const [rawSubmissionText, setRawSubmissionText] = useState('');
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [copiedSubmission, setCopiedSubmission] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load all queries (team-wide shared)
  const loadQueries = useCallback(async (searchTerm?: string, selectIdAfterLoad?: number) => {
    setIsLoadingQueries(true);
    try {
      const data = await fetchKisQueries(searchTerm);
      setQueries(data);
      if (selectIdAfterLoad) {
        setSelectedQueryId(selectIdAfterLoad);
      } else if (data.length > 0) {
        setSelectedQueryId((prev) => (prev !== null && data.some((q) => q.id === prev) ? prev : data[0].id));
      } else {
        setSelectedQueryId(null);
        setSelectedQueryDetail(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách truy vấn KIS';
      showToast(message, 'error');
    } finally {
      setIsLoadingQueries(false);
    }
  }, []);

  // Search debounce and initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadQueries(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadQueries]);

  // Load selected query detail
  useEffect(() => {
    if (selectedQueryId === null) return;

    const controller = new AbortController();
    const loadDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await fetchKisQueryDetail(selectedQueryId);
        if (controller.signal.aborted) return;
        setSelectedQueryDetail(detail);
        // Pre-fill raw text if results exist
        if (detail.results && detail.results.length > 0) {
          const prefill = detail.results
            .map((r) => `${r.video_name}, ${r.frame_idx}`)
            .join('\n');
          setRawSubmissionText(prefill);
        } else {
          setRawSubmissionText('');
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Không thể tải chi tiết truy vấn';
        showToast(message, 'error');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDetail(false);
        }
      }
    };

    void loadDetail();
    return () => controller.abort();
  }, [selectedQueryId]);

  // Handle multi-file .txt upload for queries with author attribution
  const handleQueryFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingQueries(true);
    try {
      const itemsToCreate: KisQueryItemCreate[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith('.txt')) continue;

        const queryCode = file.name.replace(/\.txt$/i, '').trim();
        const content = await file.text();
        const queryText = content.trim();

        if (queryCode && queryText) {
          itemsToCreate.push({
            query_code: queryCode,
            query_text: queryText,
            author_name: currentUserName,
            author_email: currentUserEmail,
          });
        }
      }

      if (itemsToCreate.length === 0) {
        showToast('Không tìm thấy nội dung hợp lệ trong các tệp .txt đã chọn', 'error');
        return;
      }

      const created = await batchImportKisQueries(itemsToCreate);
      showToast(`Đã nhập thành công ${created.length} truy vấn KIS!`);
      const firstId = created[0]?.id;
      await loadQueries(search, firstId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tải tệp truy vấn KIS';
      showToast(message, 'error');
    } finally {
      setIsUploadingQueries(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle result file upload (.txt, .csv)
  const handleResultFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const text = await file.text();
      setRawSubmissionText(text.trim());
      showToast(`Đã đọc nội dung từ tệp ${file.name}`);
    } catch {
      showToast('Không thể đọc nội dung tệp kết quả', 'error');
    } finally {
      if (resultFileInputRef.current) {
        resultFileInputRef.current.value = '';
      }
    }
  };

  // Live validator for raw submission text
  const validationSummary = useMemo(() => {
    if (!rawSubmissionText.trim()) {
      return { valid: 0, invalid: 0, total: 0 };
    }
    const lines = rawSubmissionText.trim().split('\n');
    let valid = 0;
    let invalid = 0;

    for (const line of lines) {
      const cleaned = line.trim();
      if (!cleaned || cleaned.startsWith('#')) continue;
      const parts = cleaned
        .replace(/\t/g, ' ')
        .replace(/,/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
      if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
        valid++;
      } else {
        invalid++;
      }
    }
    return { valid, invalid, total: valid + invalid };
  }, [rawSubmissionText]);

  // Handle saving submission results
  const handleSaveResults = async () => {
    if (!selectedQueryId) return;
    if (validationSummary.valid === 0) {
      showToast('Vui lòng nhập ít nhất một dòng kết quả hợp lệ (<video_name>, <frame_idx>)', 'error');
      return;
    }

    setIsSubmittingResults(true);
    try {
      const results = await importKisResults(
        selectedQueryId,
        rawSubmissionText,
        currentUserName,
        currentUserEmail
      );
      showToast(`Đã lưu thành công ${results.length} kết quả nộp bài!`);
      // Refresh detail and queries list
      const detail = await fetchKisQueryDetail(selectedQueryId);
      setSelectedQueryDetail(detail);
      const updatedQueries = await fetchKisQueries(search);
      setQueries(updatedQueries);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu kết quả nộp bài';
      showToast(message, 'error');
    } finally {
      setIsSubmittingResults(false);
    }
  };

  // Handle deleting query
  const handleDeleteQuery = async (queryId: number, queryCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Bạn có chắc muốn xóa truy vấn "${queryCode}" và toàn bộ kết quả đã nộp?`);
    if (!confirmed) return;

    try {
      await deleteKisQuery(queryId);
      showToast(`Đã xóa truy vấn ${queryCode}`);
      if (selectedQueryId === queryId) {
        setSelectedQueryId(null);
        setSelectedQueryDetail(null);
      }
      await loadQueries(search);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa truy vấn';
      showToast(message, 'error');
    }
  };

  // Copy query text to clipboard
  const handleCopyQueryText = () => {
    if (!selectedQueryDetail?.query_text) return;
    void navigator.clipboard.writeText(selectedQueryDetail.query_text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  // Copy full submission lines to clipboard
  const handleCopySubmissionText = async () => {
    if (!selectedQueryId || !selectedQueryDetail?.results?.length) return;
    try {
      const text = await exportKisSubmissionText(selectedQueryId);
      await navigator.clipboard.writeText(text);
      setCopiedSubmission(true);
      showToast('Đã sao chép định dạng nộp AIC vào clipboard!');
      setTimeout(() => setCopiedSubmission(false), 2000);
    } catch {
      showToast('Không thể sao chép kết quả', 'error');
    }
  };

  // Trigger file download
  const handleDownloadSubmissionFile = async () => {
    if (!selectedQueryId || !selectedQueryDetail) return;
    try {
      const text = await exportKisSubmissionText(selectedQueryId);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedQueryDetail.query_code}_submission.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Đã tải xuống ${selectedQueryDetail.query_code}_submission.txt`);
    } catch {
      showToast('Không thể tải tệp nộp bài', 'error');
    }
  };

  const totalQueriesCount = queries.length;
  const queriesWithResultsCount = queries.filter((q) => q.result_count > 0).length;

  return (
    <div className="kis-sub-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.92)' : 'var(--bg-surface-elevated)',
            color: toastMessage.type === 'error' ? '#ffffff' : 'var(--text-primary)',
            border: `1px solid ${toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'var(--accent-terracotta)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            boxShadow: 'var(--shadow-elevated)',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>{toastMessage.type === 'error' ? '⚠' : '✓'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="kis-sub-header">
        <div className="kis-sub-heading-row">
          <span className="kis-sub-sparkle" aria-hidden="true">✻</span>
          <h1 className="kis-sub-title">KIS Submission Management</h1>
        </div>
        <p className="kis-sub-subtitle">
          Quản lý danh sách truy vấn Textual Known-Item Search (KIS) và chuẩn hóa kết quả nộp bài tự động cho toàn đội thi.
        </p>
      </header>

      {/* Summary metrics */}
      <div className="kis-sub-summary" aria-label="Submission summary">
        <span><strong>{totalQueriesCount}</strong> truy vấn chung</span>
        <span className="kis-sub-summary-divider" />
        <span><strong>{queriesWithResultsCount}</strong> truy vấn đã có kết quả</span>
        <span className="kis-sub-summary-divider" />
        <span>Định dạng AIC: <code>&lt;video_name&gt;, &lt;frame_idx&gt;</code></span>
      </div>

      {/* Workspace Grid */}
      <div className="kis-sub-workspace">
        {/* ─── Left Sidebar: Query List ─── */}
        <aside className="kis-sub-panel">
          <div className="kis-sub-left-header">
            <div className="kis-sub-left-actions">
              <span className="kis-sub-left-title">Danh sách Queries ({totalQueriesCount})</span>
              <div>
                <input
                  type="file"
                  multiple
                  accept=".txt"
                  ref={fileInputRef}
                  onChange={handleQueryFilesUpload}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUploadingQueries}
                  onClick={() => fileInputRef.current?.click()}
                  title="Chọn một hoặc nhiều tệp .txt để nhập query"
                >
                  + Nhập .txt
                </Button>
              </div>
            </div>

            <div className="kis-sub-search-row">
              <div className="kis-sub-search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mã hoặc mô tả query..."
                  aria-label="Tìm kiếm query"
                />
              </div>
              <button
                type="button"
                className="kis-sub-icon-button"
                onClick={() => void loadQueries(search)}
                disabled={isLoadingQueries}
                title="Làm mới danh sách truy vấn"
                aria-label="Làm mới danh sách truy vấn"
              >
                ↻
              </button>
            </div>
          </div>

          <div className="kis-sub-query-list">
            {isLoadingQueries && queries.length === 0 ? (
              <div className="kis-sub-empty-state">
                <span className="kis-sub-empty-icon">✻</span>
                <p>Đang tải danh sách truy vấn...</p>
              </div>
            ) : queries.length === 0 ? (
              <div className="kis-sub-empty-state">
                <span className="kis-sub-empty-icon">📄</span>
                <h3>Chưa có query nào</h3>
                <p>Bấm "+ Nhập .txt" để tải lên các tệp truy vấn KIS.</p>
              </div>
            ) : (
              queries.map((q) => {
                const isSelected = selectedQueryId === q.id;
                const hasResults = q.result_count > 0;
                return (
                  <div
                    key={q.id}
                    className={`kis-sub-query-card ${isSelected ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedQueryId(q.id);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="kis-sub-card-header">
                      <span className="kis-sub-code-badge">{q.query_code}</span>
                      <span className={`kis-sub-card-status ${hasResults ? 'has-results' : 'no-results'}`}>
                        {hasResults ? `✓ ${q.result_count} kết quả` : '0 kết quả'}
                      </span>
                    </div>
                    <div className="kis-sub-card-text" title={q.query_text}>
                      {q.query_text}
                    </div>
                    <div className="kis-sub-card-footer">
                      <div className="kis-sub-card-meta">
                        <span>{new Date(q.created_at).toLocaleDateString('vi-VN')}</span>
                        {(q.author_name || q.author_email) && (
                          <span
                            className="kis-sub-author-chip"
                            title={`Tạo bởi: ${q.author_name || q.author_email}`}
                          >
                            👤 {q.author_name || (q.author_email ? q.author_email.split('@')[0] : 'Hệ thống')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="kis-sub-delete-btn"
                        onClick={(e) => handleDeleteQuery(q.id, q.query_code, e)}
                        title={`Xóa truy vấn ${q.query_code}`}
                        aria-label="Xóa truy vấn"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ─── Right Content Area: Active Query & Submission Results ─── */}
        <main className="kis-sub-panel kis-sub-detail-panel">
          {isLoadingDetail ? (
            <div className="kis-sub-empty-state">
              <span className="kis-sub-empty-icon">✻</span>
              <p>Đang tải chi tiết truy vấn...</p>
            </div>
          ) : selectedQueryDetail ? (
            <>
              {/* Query Overview Box */}
              <section className="kis-sub-overview-box">
                <div className="kis-sub-overview-header">
                  <div className="kis-sub-overview-title">
                    <span className="kis-sub-overview-code">{selectedQueryDetail.query_code}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      ID: #{selectedQueryDetail.id}
                    </span>
                    {(selectedQueryDetail.author_name || selectedQueryDetail.author_email) && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-tertiary)',
                          backgroundColor: 'var(--bg-surface-active)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        👤 Tạo bởi: {selectedQueryDetail.author_name || selectedQueryDetail.author_email}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyQueryText}
                    title="Sao chép nội dung mô tả query"
                  >
                    {copiedQuery ? '✓ Đã sao chép' : 'Sao chép Query'}
                  </Button>
                </div>
                <div className="kis-sub-overview-text">
                  {selectedQueryDetail.query_text}
                </div>
              </section>

              {/* Result Import Section */}
              <section className="kis-sub-import-card">
                <div className="kis-sub-import-header">
                  <div className="kis-sub-import-title">
                    <span>📝 Nộp kết quả dự đoán</span>
                    <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-tertiary)' }}>
                      (Định dạng AIC: <code>L00_V000, 1234</code>)
                    </span>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".txt,.csv"
                      ref={resultFileInputRef}
                      onChange={handleResultFileUpload}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resultFileInputRef.current?.click()}
                      title="Tải lên tệp kết quả .txt hoặc .csv"
                    >
                      📁 Tải tệp kết quả
                    </Button>
                  </div>
                </div>

                <textarea
                  className="kis-sub-textarea"
                  value={rawSubmissionText}
                  onChange={(e) => setRawSubmissionText(e.target.value)}
                  placeholder={`Dán danh sách kết quả tại đây, mỗi dòng một keyframe:\nL00_V000, 1234\nL00_V055, 5555\nL01_V028, 25300`}
                />

                <div className="kis-sub-import-footer">
                  <div className="kis-sub-validator-badge">
                    {validationSummary.total > 0 ? (
                      validationSummary.invalid === 0 ? (
                        <span className="kis-sub-validator-badge valid">
                          ✓ Phát hiện {validationSummary.valid} dòng kết quả hợp lệ
                        </span>
                      ) : (
                        <span className="kis-sub-validator-badge invalid">
                          ⚠ {validationSummary.valid} dòng hợp lệ, {validationSummary.invalid} dòng sai cú pháp
                        </span>
                      )
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu kết quả</span>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingResults}
                    disabled={validationSummary.valid === 0}
                    onClick={handleSaveResults}
                  >
                    💾 Lưu kết quả nộp bài
                  </Button>
                </div>
              </section>

              {/* Results Table Section */}
              <section className="kis-sub-results-section">
                <div className="kis-sub-results-bar">
                  <div className="kis-sub-results-title">
                    <span>Kết quả đã nộp</span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: selectedQueryDetail.results.length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-subtle)',
                        color: selectedQueryDetail.results.length > 0 ? 'var(--success)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {selectedQueryDetail.results.length} dòng
                    </span>
                  </div>

                  {selectedQueryDetail.results.length > 0 && (
                    <div className="kis-sub-results-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopySubmissionText}
                        title="Sao chép toàn bộ dòng kết quả để nộp"
                      >
                        {copiedSubmission ? '✓ Đã sao chép' : '📋 Sao chép định dạng nộp'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadSubmissionFile}
                        title="Xuất tệp text nộp bài"
                      >
                        ⬇ Xuất .txt
                      </Button>
                    </div>
                  )}
                </div>

                {selectedQueryDetail.results.length === 0 ? (
                  <div className="kis-sub-empty-state" style={{ minHeight: '140px' }}>
                    <p>Chưa có kết quả nộp nào cho truy vấn này. Hãy dán kết quả ở khung trên và bấm "Lưu kết quả nộp bài".</p>
                  </div>
                ) : (
                  <div className="kis-sub-table-wrapper">
                    <table className="kis-sub-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px' }}># Rank</th>
                          <th>Video Name</th>
                          <th>Frame Index</th>
                          <th>Confidence</th>
                          <th style={{ width: '90px', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQueryDetail.results.map((res) => (
                          <tr key={res.id}>
                            <td>
                              <span className="kis-sub-rank-badge">{res.rank}</span>
                            </td>
                            <td className="kis-sub-video-cell">{res.video_name}</td>
                            <td className="kis-sub-frame-cell">{res.frame_idx}</td>
                            <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                              {res.confidence !== null && res.confidence !== undefined ? res.confidence.toFixed(4) : '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-tertiary)',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontFamily: 'var(--font-sans)',
                                }}
                                onClick={() => {
                                  void navigator.clipboard.writeText(`${res.video_name}, ${res.frame_idx}`);
                                  showToast(`Đã sao chép ${res.video_name}, ${res.frame_idx}`);
                                }}
                                title="Sao chép dòng này"
                              >
                                📋 Sao chép
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="kis-sub-empty-state">
              <span className="kis-sub-empty-icon">✻</span>
              <h3>Chọn một truy vấn KIS</h3>
              <p>
                Chọn một truy vấn từ danh sách bên trái để xem mô tả chi tiết, hoặc bấm "+ Nhập .txt" để tải lên tệp truy vấn mới.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default KisSubmissionPage;
