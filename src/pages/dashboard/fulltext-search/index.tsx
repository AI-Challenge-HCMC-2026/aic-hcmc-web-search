import React from 'react';
import SearchPageShell from '../../../components/search/SearchPageShell';

export const FulltextSearchPage: React.FC = () => (
  <SearchPageShell
    title="Full Text Search"
    subtitle="Tìm toàn văn trên transcript ASR và nội dung OCR của video."
    description="Tìm chính xác câu thoại, từ khóa trên màn hình và văn bản xuất hiện trong khung hình."
    placeholder="Nhập từ khóa, câu thoại hoặc văn bản OCR…"
    filters={[{ label: 'Source', options: ['ASR + OCR', 'ASR transcript', 'OCR text'], defaultValue: 'ASR + OCR' }, { label: 'Top K', options: ['12', '24', '48'], defaultValue: '24' }, { label: 'Language', options: ['All languages', 'Vietnamese', 'English'] }]}
    suggestions={['tìm câu “xin chào”', 'biển hiệu có chữ HTV', 'transcript nhắc đến dữ liệu']}
    resultLabel="TEXT MATCHES"
  />
);

export default FulltextSearchPage;
