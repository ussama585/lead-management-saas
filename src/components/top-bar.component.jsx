import { Button } from './ui/app-controls.jsx';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Avatar, Badge, Menu, Dropdown, Typography, Space } from 'antd';
import { Bell as BellOutlined, ChevronDown as DownOutlined, ChevronsLeft as DoubleLeftOutlined, ChevronsRight as DoubleRightOutlined, Menu as MenuOutlined } from 'lucide-react';
import '../assets/styles/legacy/layout/top-bar.css'; // Ensure the CSS file is imported

import Notification from './notification-card.component.jsx';
import ProfileImagePlaceholder from '../assets/images/user-card-icons/user-placeholder.svg'
import useUserStore from '../pages/shared/store/user-store.js'

const { Header } = Layout;

const TopBar = ({ name, email, collapsed, onToggleCollapsed, isMobile }) => {

  const navigate = useNavigate();

  const { clearUser } = useUserStore();


  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const handleMenuClick = ({ key }) => {
    console.log(`Clicked menu item: ${key}`);
    setMenuVisible(false);
  };

  const handleVisibleChange = (flag) => {
    setMenuVisible(flag);
  };


  const handleLogoutClick = (e) => {
    if (e.key === 'logout') {
        // Clear user data from the store and localStorage
        clearUser();

        // Remove tokens from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Clear all persistent table states from sessionStorage
        try {
            // Clear all sessionStorage items that start with 'tableState_'
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('tableState_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));

            console.log('Cleared all persistent table states on logout');
        } catch (e) {
            console.warn('Failed to clear table states on logout:', e);
        }

    }
};

  // User menu with links
  const userMenu = (
    <Menu onClick={handleLogoutClick}>
      {email && (
        <Menu.Item key="email" disabled className="topbar-user-menu-email">
          {email}
        </Menu.Item>
      )}
      <Menu.Item key="logout" className="topbar-user-menu-item">
        <a>Logout</a>
      </Menu.Item>
    </Menu>
  );

  const notifications = [
    { id: 'notification1', text: 'You have a new message!', isRead: false },
    { id: 'notification2', text: 'Your profile was updated.', isRead: true },
    { id: 'notification3', text: 'System maintenance will occur tonight.', isRead: false },
    { id: 'notification4', text: 'Your password has been changed successfully.', isRead: true },
  ];

  const notificationMenu = (
    <Menu className="notification-menu">
      {notifications.map((notification) => (
        <Menu.Item key={notification.id}>
          <Notification notification={notification.text} isRead={notification.isRead} />
        </Menu.Item>
      ))}
      <Menu.Item className="topbar-menu-item">
        <a href="/notifications">View All</a>
      </Menu.Item>
    </Menu>
  );

  const renderSidebarToggle = () => {
    if (!onToggleCollapsed) return null;

    let icon;
    let ariaLabel;
    if (isMobile && collapsed) {
      icon = <MenuOutlined size="1em" className="app-icon" />;
      ariaLabel = 'Open sidebar';
    } else if (collapsed) {
      icon = <DoubleRightOutlined size="1em" className="app-icon" />;
      ariaLabel = 'Expand sidebar';
    } else {
      icon = <DoubleLeftOutlined size="1em" className="app-icon" />;
      ariaLabel = 'Collapse sidebar';
    }

    return (
      <Button
        type="text"
        onClick={onToggleCollapsed}
        className="sider-collapse-btn topbar-sider-toggle"
        aria-label={ariaLabel}
      >
        {icon}
      </Button>
    );
  };

  return (
    <Header className="topbar-header">
      <div className="topbar-inner">
        {renderSidebarToggle()}
      <Space className="topbar-space">
        {/* User Dropdown */}
        <Dropdown overlay={userMenu} onVisibleChange={handleVisibleChange} visible={menuVisible} trigger={['click']}>
          <Button type="text" className="topbar-user-dropdown">
            <Space align="center">
              <Avatar src={ProfileImagePlaceholder} size={30} className="topbar-avatar" />
              <Typography.Text className="topbar-username">{name}</Typography.Text>
              <DownOutlined size="1em" className={["app-icon", "topbar-downarrow"].filter(Boolean).join(' ')} />
            </Space>
          </Button>
        </Dropdown>

        {/* Notification Dropdown */}
        {/* <Dropdown overlay={notificationMenu} onVisibleChange={setNotificationVisible} visible={notificationVisible} trigger={['click']}>
          <Badge count={notifications.filter(notification => !notification.isRead).length} offset={[-5, 5]} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              className="topbar-notification-button"
              onMouseEnter={(e) => e.currentTarget.classList.add('hover')}
              onMouseLeave={(e) => e.currentTarget.classList.remove('hover')}
            />
          </Badge>
        </Dropdown> */}

        
      </Space>
      </div>
    </Header>
  );
};

export default TopBar;
