import React, { useState, useCallback } from 'react';
import { Input, Modal, List, Tag, Typography, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchApi, SearchResults } from '../api/search';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const debounceRef = React.useRef<NodeJS.Timeout>();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.global(value);
        setResults(res.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const handleSelect = (type: string, id: number) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    switch (type) {
      case 'artwork': navigate('/artworks'); break;
      case 'event': navigate('/events'); break;
      case 'product': navigate('/marketplace'); break;
      case 'course': navigate('/courses'); break;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'artwork': return 'purple';
      case 'event': return 'blue';
      case 'product': return 'green';
      case 'course': return 'orange';
      default: return 'default';
    }
  };

  const allResults = results ? [
    ...results.artworks.map(a => ({ id: a.id, name: a.title, type: 'artwork' })),
    ...results.events.map(e => ({ id: e.id, name: e.name, type: 'event' })),
    ...results.products.map(p => ({ id: p.id, name: p.name, type: 'product' })),
    ...results.courses.map(c => ({ id: c.id, name: c.title, type: 'course' })),
  ] : [];

  return (
    <>
      <Input
        prefix={<SearchOutlined />}
        placeholder={t('search.placeholder')}
        onClick={() => setOpen(true)}
        readOnly
        style={{ width: 250, cursor: 'pointer' }}
      />
      <Modal
        title={t('search.title')}
        open={open}
        onCancel={() => { setOpen(false); setQuery(''); setResults(null); }}
        footer={null}
        width={550}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('search.searchPlaceholder')}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          size="large"
          autoFocus
          style={{ marginBottom: 16 }}
        />
        {loading && <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>}
        {!loading && results && allResults.length === 0 && (
          <Empty description={t('search.noResults')} />
        )}
        {!loading && allResults.length > 0 && (
          <List
            dataSource={allResults}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelect(item.type, item.id)}
              >
                <List.Item.Meta
                  title={<Text>{item.name}</Text>}
                />
                <Tag color={typeColor(item.type)}>{item.type}</Tag>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
}
