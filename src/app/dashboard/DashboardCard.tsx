'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import styles from './DashboardCard.module.scss';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel = 'vs last period',
}) => {
  const isTrendPositive = trend && trend > 0;
  const isTrendNegative = trend && trend < 0;
  const trendValue = trend ? Math.abs(trend) : 0;
  
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.icon}>{icon}</div>
      </div>
      <p className={styles.value}>{value}</p>
      {trend !== undefined && (
        <div className={styles.footer}>
          <div className={`${styles.trend} ${isTrendPositive ? styles.positive : isTrendNegative ? styles.negative : ''}`}>
            {isTrendPositive ? (
              <>
                <ArrowUp size={16} />
                {trendValue}%
              </>
            ) : isTrendNegative ? (
              <>
                <ArrowDown size={16} />
                {trendValue}%
              </>
            ) : (
              '0%'
            )}
          </div>
          <span className={styles.trendLabel}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
