import React from 'react';
import SearchPageShell from '../../../components/search/SearchPageShell';

export const ObjectsSearchPage: React.FC = () => (
  <SearchPageShell
    title="Objects Search"
    subtitle="Tìm kiếm vật thể trực quan và vùng bounding box trong keyframe."
    description="Lọc theo đối tượng được phát hiện, độ tin cậy và bộ sưu tập nguồn."
    placeholder="Ví dụ: tìm ô tô, xe máy hoặc ba lô…"
    filters={[{ label: 'Confidence', options: ['0.50', '0.70', '0.90'], defaultValue: '0.70' }, { label: 'Top K', options: ['12', '24', '48'], defaultValue: '24' }, { label: 'Object', options: ['Any object', 'Person', 'Vehicle', 'Sign'] }]}
    suggestions={['người cầm ô màu xanh', 'ô tô màu trắng', 'xe máy gần biển báo']}
    resultLabel="OBJECT DETECTIONS"
  />
);

export default ObjectsSearchPage;
