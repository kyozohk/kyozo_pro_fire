'use client';

import React from 'react';
import Link from 'next/link';
import styles from './home.module.scss';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Kyozo Pro Fire</h1>
        <p>Community Management Platform</p>
      </header>
      
      <main className={styles.main}>
        <div className={styles.card}>
          <h2>Dashboard</h2>
          <p>Access the admin dashboard to manage communities and users.</p>
          <Link href="/dashboard" className={styles.button}>
            Go to Dashboard
          </Link>
        </div>
        
        <div className={`${styles.card} ${styles.primaryCard}`}>
          <h2>Community Inbox</h2>
          <p>View and manage community messages in our new inbox interface. This feature allows you to select communities and view conversations with users.</p>
          <Link href="/landing" className={`${styles.button} ${styles.primaryButton}`}>
            Open Community Inbox
          </Link>
        </div>
      </main>
    </div>
  );
}
