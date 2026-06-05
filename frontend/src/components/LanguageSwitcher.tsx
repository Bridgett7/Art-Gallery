import { Button, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const items = [
    { key: 'en', label: '🇬🇧 English' },
    { key: 'fr', label: '🇫🇷 Français' },
  ];

  return (
    <Dropdown
      menu={{ items, onClick: ({ key }) => i18n.changeLanguage(key) }}
      placement="bottomRight"
    >
      <Button type="text" icon={<GlobalOutlined />}>
        {i18n.language === 'fr' ? 'FR' : 'EN'}
      </Button>
    </Dropdown>
  );
}
