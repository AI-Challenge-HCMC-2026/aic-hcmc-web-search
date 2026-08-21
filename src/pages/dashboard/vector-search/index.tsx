import React from 'react';
import SearchPageShell from '../../../components/search/SearchPageShell';

export const VectorSearchPage: React.FC = () => (
  <SearchPageShell
    title="Vector Search"
    subtitle="Tìm kiếm ngữ nghĩa bằng embedding trên nội dung video và keyframe."
    description="So khớp ý định và ngữ cảnh thay vì chỉ tìm đúng từ khóa."
    placeholder="Mô tả nội dung bạn muốn tìm…"
    filters={[{ label: 'Threshold', options: ['0.70', '0.80', '0.90'], defaultValue: '0.80' }, { label: 'Top K', options: ['12', '24', '48'], defaultValue: '24' }, { label: 'Collection', options: ['All collections', 'Videos L21', 'Videos L22'] }]}
    suggestions={['người đi xe đạp trong thành phố', 'cảnh phỏng vấn ngoài trời', 'bảng hiệu có chữ màu đỏ']}
    resultLabel="SEMANTIC RESULTS"
  />
);

export default VectorSearchPage;
