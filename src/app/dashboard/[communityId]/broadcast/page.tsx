'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import styles from './BroadcastPage.module.scss';

export default function BroadcastPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  
  return (
    <div className={styles.broadcastPage}>
      <h1 className={styles.pageTitle}>Broadcast Messages</h1>
      
      <div className={styles.broadcastCard}>
        <h2 className={styles.cardTitle}>Send a message to all members</h2>
        <p className={styles.cardDescription}>
          Use this feature to send a message to all members of your community.
          You can send messages via WhatsApp, SMS, or email.
        </p>
        
        <div className={styles.broadcastForm}>
          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.label}>Message</label>
            <textarea 
              id="message" 
              className={styles.textarea}
              placeholder="Enter your message here..."
              rows={5}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Send via</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} />
                WhatsApp
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} />
                SMS
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} />
                Email
              </label>
            </div>
          </div>
          
          <button className={styles.sendButton}>
            Send Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}
