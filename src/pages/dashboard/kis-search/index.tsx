import React from 'react';
import SearchPageShell from '../../../components/search/SearchPageShell';

export const KisSearchPage: React.FC = () => (
  <SearchPageShell
    title="KIS Search"
    subtitle="Truy vấn Known-Item Search theo mốc thời gian và video cụ thể."
    description="Khoanh vùng một sự kiện đã biết bằng video, ngày phát hành và khoảng thời gian."
    placeholder="Ví dụ: tìm cảnh lúc 03:20 trong L21_V001…"
    filters={[{ label: 'Time range', options: ['Any time', '±30 sec', '±2 min'], defaultValue: '±30 sec' }, { label: 'Collection', options: ['All collections', 'Videos L21', 'Videos L22'] }, { label: 'Sort', options: ['Closest first', 'Chronological'] }]}
    suggestions={['L21_V001 lúc 03:20', 'video L22_V014 ngày 14/08/2024', 'keyframe gần giây thứ 90']}
    resultLabel="KNOWN-ITEM RESULTS"
  />
);

export default KisSearchPage;
