import React from 'react';
import { Skeleton, Card, Avatar, List } from 'antd';
import './skeleton-loader.component.css';

/**
 * Skeleton Loader Component
 * Provides various skeleton loading states for different UI elements
 *
 * @param {string} type - Type of skeleton: 'card', 'text', 'avatar', 'list', 'stats-card', 'table-row', 'chart'
 * @param {number} rows - Number of rows/lines for text skeleton (default: 1)
 * @param {number} count - Number of items to show for list skeleton (default: 1)
 * @param {boolean} active - Whether the skeleton should animate (default: true)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 * @param {boolean} showAvatar - Whether to show avatar in list items (default: false)
 * @param {object} cardProps - Additional props for Card skeleton
 * @param {object} avatarProps - Additional props for Avatar skeleton
 *
 * @example
 * // Basic text skeleton
 * <SkeletonLoader type="text" rows={2} />
 *
 * @example
 * // Stats card skeleton (matches the project's StatsCard component)
 * <SkeletonLoader type="stats-card" />
 *
 * @example
 * // Card skeleton with avatar
 * <SkeletonLoader type="card" showAvatar={true} />
 *
 * @example
 * // List skeleton with 5 items and avatars
 * <SkeletonLoader type="list" count={5} showAvatar={true} />
 *
 * @example
 * // Table row skeleton with 4 columns
 * <SkeletonLoader type="table-row" rows={4} />
 *
 * @example
 * // Chart skeleton
 * <SkeletonLoader type="chart" />
 *
 * @example
 * // Chart skeleton (no Card wrapper) - use inside existing cards
 * <SkeletonLoader type="chart-plain" />
 *
 * @example
 * // Loading dashboard metrics
 * {isLoading ? (
 *   <div className="metrics-grid">
 *     {Array.from({ length: 6 }, (_, i) => (
 *       <SkeletonLoader key={i} type="stats-card" />
 *     ))}
 *   </div>
 * ) : (
 *   // Render actual metrics
 * )}
 */
const SkeletonLoader = ({
  type = 'text',
  rows = 1,
  count = 1,
  active = true,
  className = '',
  style = {},
  showAvatar = false,
  cardProps = {},
  avatarProps = {},
  ...props
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card
            className={`skeleton-card ${className}`}
            style={style}
            {...cardProps}
          >
            <Skeleton
              active={active}
              paragraph={{ rows: 3 }}
              avatar={showAvatar ? { size: 'large' } : false}
              {...props}
            />
          </Card>
        );

      case 'stats-card':
        return (
          <Card
            className={`skeleton-stats-card ${className}`}
            style={{
              width: 320,
              borderRadius: '20px',
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
              ...style
            }}
            {...cardProps}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <Skeleton
                  active={active}
                  title={{ width: '60%' }}
                  paragraph={{ rows: 2, width: ['40%', '30%'] }}
                  avatar={false}
                  {...props}
                />
              </div>
              <div style={{ marginLeft: '8px' }}>
                <Skeleton.Avatar
                  active={active}
                  size={32}
                  shape="circle"
                  {...avatarProps}
                />
              </div>
            </div>
          </Card>
        );

      case 'text':
        return (
          <Skeleton
            active={active}
            paragraph={{ rows, width: Array.isArray(rows) ? rows : Array(rows).fill('100%') }}
            title={false}
            avatar={false}
            className={className}
            style={style}
            {...props}
          />
        );

      case 'avatar':
        return (
          <Skeleton
            active={active}
            avatar={{ size: 'large', ...avatarProps }}
            paragraph={false}
            title={false}
            className={className}
            style={style}
            {...props}
          />
        );

      case 'list':
        const listItems = Array.from({ length: count }, (_, index) => (
          <List.Item key={index}>
            {showAvatar && (
              <Skeleton.Avatar
                active={active}
                size="large"
                style={{ marginRight: '12px' }}
                {...avatarProps}
              />
            )}
            <Skeleton
              active={active}
              title={{ width: '60%' }}
              paragraph={{ rows: 1, width: '80%' }}
              avatar={false}
              {...props}
            />
          </List.Item>
        ));

        return (
          <List
            className={`skeleton-list ${className}`}
            style={style}
            dataSource={listItems}
            renderItem={(item) => item}
          />
        );

      case 'table-row':
        return (
          <div className={`skeleton-table-row ${className}`} style={style}>
            {Array.from({ length: rows }, (_, index) => (
              <div key={index} className="skeleton-table-cell">
                <Skeleton
                  active={active}
                  title={false}
                  paragraph={{ rows: 1, width: '100%' }}
                  avatar={false}
                  {...props}
                />
              </div>
            ))}
          </div>
        );

      case 'chart':
        return (
          <Card
            className={`skeleton-chart ${className}`}
            style={{
              height: 300,
              ...style
            }}
            {...cardProps}
          >
            <div style={{ padding: '20px' }}>
              <Skeleton
                active={active}
                title={{ width: '30%' }}
                paragraph={false}
                avatar={false}
                style={{ marginBottom: '20px' }}
                {...props}
              />
              <div className="skeleton-chart-placeholder">
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: active ? 'skeleton-loading 1.5s infinite' : 'none'
                }} />
              </div>
            </div>
          </Card>
        );

      case 'chart-plain':
        return (
          <div className={`skeleton-chart ${className}`} style={{ padding: '20px', ...style }}>
            <Skeleton
              active={active}
              title={{ width: '30%' }}
              paragraph={false}
              avatar={false}
              style={{ marginBottom: '20px' }}
              {...props}
            />
            <div className="skeleton-chart-placeholder">
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: active ? 'skeleton-loading 1.5s infinite' : 'none'
              }} />
            </div>
          </div>
        );

      default:
        return (
          <Skeleton
            active={active}
            className={className}
            style={style}
            {...props}
          />
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
