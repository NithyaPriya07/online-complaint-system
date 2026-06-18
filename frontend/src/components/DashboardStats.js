import React from 'react';

const DashboardStats = ({ stats }) => {
  const { total = 0, pending = 0, inProgress = 0, resolved = 0, closed = 0 } = stats || {};

  const statItems = [
    {
      title: 'Total Complaints',
      value: total,
      icon: '📋',
      color: 'rgba(124, 58, 237, 0.15)',
      textColor: 'hsl(263, 90%, 65%)',
    },
    {
      title: 'Pending',
      value: pending,
      icon: '⏳',
      color: 'rgba(245, 158, 11, 0.15)',
      textColor: 'hsl(38, 92%, 50%)',
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: '⚙️',
      color: 'rgba(14, 165, 233, 0.15)',
      textColor: 'hsl(200, 95%, 50%)',
    },
    {
      title: 'Resolved / Closed',
      value: resolved + closed,
      icon: '✅',
      color: 'rgba(16, 185, 129, 0.15)',
      textColor: 'hsl(142, 70%, 45%)',
    },
  ];

  return (
    <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
      {statItems.map((item, index) => (
        <div key={index} className="stats-card">
          <div className="stats-info">
            <h4>{item.title}</h4>
            <div className="stats-value" style={{ color: item.textColor }}>{item.value}</div>
          </div>
          <div className="stats-icon" style={{ backgroundColor: item.color, color: item.textColor }}>
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
