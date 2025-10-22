'use client';

import React, { useState } from 'react';
import { 
  FloatingLabelInput, 
  CustomCheckbox, 
  CustomRadio, 
  CustomDropdown, 
  CustomDialog,
  CustomSelect
} from '@/components/ui/custom-components';

export default function ExamplesPage() {
  // State for form elements
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedOption, setSelectedOption] = useState('option1');
  const [dropdownValue, setDropdownValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dropdown options
  const dropdownOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  // Select options
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1>Custom Components Examples</h1>
        <p style={{ marginBottom: '2rem' }}>
          This page demonstrates the custom components imported from the reference project.
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2>FloatingLabelInput</h2>
          <div style={{ marginBottom: '1rem' }}>
            <FloatingLabelInput 
              label="Email" 
              placeholder="Enter your email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <FloatingLabelInput 
              label="Password" 
              placeholder="Enter your password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>CustomCheckbox</h2>
          <CustomCheckbox 
            id="terms" 
            name="terms" 
            label="I agree to the terms and conditions" 
            checked={termsAccepted} 
            onChange={(e) => setTermsAccepted(e.target.checked)} 
          />
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>CustomRadio</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <CustomRadio 
              id="option1" 
              name="options" 
              value="option1" 
              label="Option 1" 
              checked={selectedOption === 'option1'} 
              onChange={(e) => setSelectedOption(e.target.value)} 
            />
            <CustomRadio 
              id="option2" 
              name="options" 
              value="option2" 
              label="Option 2" 
              checked={selectedOption === 'option2'} 
              onChange={(e) => setSelectedOption(e.target.value)} 
            />
            <CustomRadio 
              id="option3" 
              name="options" 
              value="option3" 
              label="Option 3" 
              checked={selectedOption === 'option3'} 
              onChange={(e) => setSelectedOption(e.target.value)} 
            />
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>CustomDropdown</h2>
          <CustomDropdown 
            label="Select an option" 
            options={dropdownOptions} 
            value={dropdownValue} 
            onChange={(value) => setDropdownValue(value)} 
          />
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>CustomSelect</h2>
          <CustomSelect 
            id="select-example"
            name="select-example"
            placeholder="Select an option"
            options={selectOptions}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
          />
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>CustomDialog</h2>
          <button 
            onClick={() => setIsDialogOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Open Dialog
          </button>
          
          <CustomDialog 
            isOpen={isDialogOpen} 
            onClose={() => setIsDialogOpen(false)} 
            title="Dialog Title" 
            subtitle="This is a custom dialog component" 
          >
            <p>This is the content of the dialog. You can put any content here.</p>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsDialogOpen(false)}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </CustomDialog>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>Communities List Example</h2>
          <div className="communities-grid">
            {[1, 2, 3].map((item) => (
              <div key={item} className="gradient-border">
                <div className="community-card">
                  <div className="card-header">
                    <div className="community-logo-placeholder">
                      C{item}
                    </div>
                    <div className="privacy-badge">
                      Public
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="community-name">Community {item}</h3>
                    <p className="community-description">
                      This is a sample community description. It shows how the community card looks with the dark theme styling.
                    </p>
                    <div className="community-stats">
                      <div className="stat">
                        <span>👥</span> 125 members
                      </div>
                      <div className="stat">
                        <span>💬</span> 45 messages
                      </div>
                    </div>
                    <div className="category">
                      Technology
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className="activity-indicator">
                      <div className="activity-dot"></div>
                      Active now
                    </div>
                    <div className="member-growth">
                      +12% this week
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Messages List Example</h2>
          <div className="messages-layout">
            <div className="conversations-list">
              <div className="conversations-header">
                <h3 className="conversations-title">Conversations</h3>
                <button className="new-message-button">New Message</button>
              </div>
              <div className="conversations">
                {[1, 2, 3].map((item) => (
                  <div key={item} className={`conversation-item ${item === 1 ? 'active' : ''}`}>
                    <div className="community-logo-placeholder conversation-avatar">
                      U{item}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h4 className="conversation-name">User {item}</h4>
                        <span className="conversation-time">10:30 AM</span>
                      </div>
                      <p className="last-message">
                        This is the last message from the conversation...
                      </p>
                    </div>
                    {item === 2 && (
                      <div className="unread-badge">3</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="chat-area">
              <div className="chat-header">
                <div className="chat-info">
                  <div className="community-logo-placeholder chat-avatar">
                    U1
                  </div>
                  <div>
                    <h4 className="chat-name">User 1</h4>
                    <span className="chat-status">Online</span>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="chat-action-button">📞</button>
                  <button className="chat-action-button">📹</button>
                  <button className="chat-action-button">⚙️</button>
                </div>
              </div>
              <div className="messages-container">
                <div className="message">
                  <div className="community-logo-placeholder message-avatar">
                    U1
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <p>Hello! How are you doing today?</p>
                    </div>
                    <span className="message-time">10:15 AM</span>
                  </div>
                </div>
                <div className="message own">
                  <div className="community-logo-placeholder message-avatar">
                    Me
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <p>I'm doing great! How about you?</p>
                    </div>
                    <span className="message-time">10:17 AM</span>
                  </div>
                </div>
                <div className="message">
                  <div className="community-logo-placeholder message-avatar">
                    U1
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <p>I'm good too! Just checking out these new custom components.</p>
                    </div>
                    <span className="message-time">10:20 AM</span>
                  </div>
                </div>
              </div>
              <div className="message-input">
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="Type your message here..." 
                />
                <button className="send-button">Send</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
