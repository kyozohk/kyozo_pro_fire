'use client';

import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import styles from '../Dashboard.module.scss';

const SubscriptionPage: React.FC = () => {
  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Subscription</h1>
          <p className={styles.subtitle}>
            Manage your community subscription
          </p>
        </div>
      </div>

      <div className="bg-card-bg rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <CreditCard className="text-accent-pink mr-3" size={24} />
          <h2 className="text-xl font-semibold">Payment Method</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="bg-background p-4 rounded-md border border-border flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">Current Plan</span>
              <span className="bg-accent-pink/20 text-accent-pink text-xs px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-lg font-medium mb-1">Pro Plan</h3>
            <p className="text-text-secondary text-sm mb-3">$49/month</p>
            <div className="flex items-center text-sm text-text-secondary">
              <CheckCircle size={16} className="text-accent-green mr-2" />
              Renews on November 22, 2025
            </div>
          </div>
          
          <div className="bg-background p-4 rounded-md border border-border flex-1">
            <h3 className="text-lg font-medium mb-3">Payment Details</h3>
            <div className="flex items-center mb-3">
              <div className="w-10 h-6 bg-gray-700 rounded mr-3 flex items-center justify-center text-xs text-white">VISA</div>
              <span>•••• •••• •••• 4242</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Expires</span>
              <span>12/2026</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button className="px-4 py-2 bg-accent-pink text-white rounded-md hover:bg-accent-pink/90 transition-colors">
            Update Payment Method
          </button>
          <button className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-md hover:bg-background transition-colors">
            View Billing History
          </button>
        </div>
      </div>
      
      <div className="bg-card-bg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border rounded-md p-4 bg-background">
            <h3 className="text-lg font-medium mb-2">Starter</h3>
            <p className="text-2xl font-bold mb-3">$19<span className="text-sm text-text-secondary font-normal">/month</span></p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Up to 100 members</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Basic analytics</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Email support</span>
              </li>
            </ul>
          </div>
          
          <div className="border-2 border-accent-pink rounded-md p-4 bg-background relative">
            <div className="absolute -top-3 right-4 bg-accent-pink text-white text-xs px-2 py-1 rounded-full">
              Current Plan
            </div>
            <h3 className="text-lg font-medium mb-2">Pro</h3>
            <p className="text-2xl font-bold mb-3">$49<span className="text-sm text-text-secondary font-normal">/month</span></p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Up to 1,000 members</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Custom branding</span>
              </li>
            </ul>
          </div>
          
          <div className="border border-border rounded-md p-4 bg-background">
            <h3 className="text-lg font-medium mb-2">Enterprise</h3>
            <p className="text-2xl font-bold mb-3">$199<span className="text-sm text-text-secondary font-normal">/month</span></p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Unlimited members</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>Dedicated support</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle size={16} className="text-accent-green mr-2" />
                <span>White labeling</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
