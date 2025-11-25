import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
  executionMode,
  onContinue,
  onEditUserMessage,
  onRerunStage1Model,
  onRerunStage2Model,
  onRerunStage3,
  onSetMode,
  theme,
  onToggleTheme,
  editingPrompt,
  editPromptText,
  onEditChange,
  onEditSave,
  onEditCancel,
  rerunStage1ModelLoading,
  rerunStage2ModelLoading,
  rerunStage3Loading,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
        <div>
          <label style={{ marginRight: 8 }}>Execution Mode:</label>
          <select value={executionMode} onChange={(e) => onSetMode?.(e.target.value)}>
            <option value="auto">Auto</option>
            <option value="step">Step-by-step</option>
          </select>
        </div>
        <div className="toggle" aria-label="Theme toggle" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', marginRight: 8 }}>Theme:</span>
          <button
            type="button"
            className="toggle-switch"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Toggle dark mode"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="thumb" aria-hidden="true" />
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', marginLeft: 8 }}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </div>
      </div>
      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Ask a question to consult the LLM Council</p>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    {editingPrompt && index === conversation.messages.length - 2 ? (
                      <div className="prompt-edit">
                        <textarea
                          className="input"
                          value={editPromptText}
                          onChange={(e) => onEditChange?.(e.target.value)}
                          disabled={isLoading}
                          rows={4}
                          style={{ width: '100%', minHeight: 80 }}
                          aria-label="Edit prompt"
                          onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onEditSave?.(editPromptText)
                          }}
                        />
                        <div className="dialog-actions" style={{ marginTop: 8 }}>
                          <button className="btn primary" onClick={() => onEditSave?.(editPromptText)} disabled={isLoading}>Save and Rerun</button>
                          <button className="btn" onClick={onEditCancel} disabled={isLoading}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="markdown-content">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {index === conversation.messages.length - 2 && (
                          <div style={{ marginTop: 8 }}>
                            <button className="icon-button" onClick={onEditUserMessage} disabled={isLoading} aria-label="Edit prompt" title="Edit prompt">Edit</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  <div className="message-label">LLM Council</div>

                  {/* Stage 1 */}
                  {msg.loading?.stage1 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 1: Collecting individual responses...</span>
                    </div>
                  )}
                  {msg.stage1 && (
                    <Stage1
                      responses={msg.stage1}
                      onRerun={(model) => onRerunStage1Model?.(model)}
                      disabled={isLoading}
                      loadingModel={rerunStage1ModelLoading}
                    />
                  )}

                  {/* Stage 2 */}
                  {msg.loading?.stage2 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 2: Peer rankings...</span>
                    </div>
                  )}
                  {msg.stage2 && (
                    <Stage2
                      rankings={msg.stage2}
                      labelToModel={msg.metadata?.label_to_model}
                      aggregateRankings={msg.metadata?.aggregate_rankings}
                      onRerun={(model) => onRerunStage2Model?.(model)}
                      disabled={isLoading}
                      loadingModel={rerunStage2ModelLoading}
                    />
                  )}

                  {/* Stage 3 */}
                  {msg.loading?.stage3 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 3: Final synthesis...</span>
                    </div>
                  )}
                  {msg.stage3 && (
                    <Stage3
                      finalResponse={msg.stage3}
                      onRerun={() => onRerunStage3?.()}
                      disabled={isLoading || rerunStage3Loading}
                      loading={rerunStage3Loading}
                    />
                  )}

                  {msg.paused && (
                    <div className="stage-loading" style={{ marginTop: 12 }}>
                      <span>Execution paused after {msg.pausedStage}. Continue to next stage?</span>
                      <button className="icon-button" style={{ marginLeft: 8 }} onClick={onContinue} disabled={isLoading}>Continue</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {conversation.messages.length === 0 && (
        <form className="input-form" onSubmit={handleSubmit}>
          <textarea
            className="message-input"
            placeholder="Ask your question... (Shift+Enter for new line, Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={3}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
