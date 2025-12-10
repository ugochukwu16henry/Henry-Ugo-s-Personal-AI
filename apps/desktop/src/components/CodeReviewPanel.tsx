/**
 * Code Review Panel Component
 * Shows AI code review results with issues and suggestions
 */

import { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiShield, FiZap, FiX } from 'react-icons/fi';
import { CodeReviewService, type CodeReviewResult, type CodeReviewIssue } from '../services/ai/codeReview';
import { AVAILABLE_MODELS } from '../services/ai/models';
import { UnifiedAIClient } from '../services/ai/api';
import './CodeReviewPanel.css';

interface CodeReviewPanelProps {
  code: string;
  language?: string;
  filePath?: string;
  isOpen: boolean;
  onClose: () => void;
  apiClient?: UnifiedAIClient;
  modelId?: string;
}

export function CodeReviewPanel({
  code,
  language,
  filePath,
  isOpen,
  onClose,
  apiClient,
  modelId = 'composer-1'
}: CodeReviewPanelProps) {
  const [review, setReview] = useState<CodeReviewResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && code) {
      performReview();
    }
  }, [isOpen]); // Only run when panel opens, not on every code change

  const performReview = async () => {
    setIsReviewing(true);
    setError(null);
    setReview(null);

    try {
      const model = AVAILABLE_MODELS[modelId];
      const reviewService = new CodeReviewService(model, apiClient);
      const result = await reviewService.reviewCode(code, language, filePath);
      setReview(result);
    } catch (err: any) {
      setError(err.message || 'Failed to review code');
    } finally {
      setIsReviewing(false);
    }
  };

  if (!isOpen) return null;

  const getIssueIcon = (type: CodeReviewIssue['type']) => {
    switch (type) {
      case 'bug':
        return <FiAlertCircle className="review-issue-icon review-issue-bug" />;
      case 'security':
        return <FiShield className="review-issue-icon review-issue-security" />;
      case 'performance':
        return <FiZap className="review-issue-icon review-issue-performance" />;
      case 'style':
        return <FiInfo className="review-issue-icon review-issue-style" />;
      default:
        return <FiInfo className="review-issue-icon review-issue-suggestion" />;
    }
  };

  const getSeverityColor = (severity: CodeReviewIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return '#e45649';
      case 'high':
        return '#d7ba7d';
      case 'medium':
        return '#ce9178';
      case 'low':
        return '#858585';
      default:
        return '#858585';
    }
  };

  return (
    <div className="code-review-panel-overlay" onClick={onClose}>
      <div className="code-review-panel" onClick={(e) => e.stopPropagation()}>
        <div className="code-review-header">
          <h3>AI Code Review</h3>
          <button className="code-review-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        {filePath && (
          <div className="code-review-file">
            📁 {filePath}
          </div>
        )}

        {isReviewing && (
          <div className="code-review-loading">
            <div className="code-review-spinner"></div>
            <span>Analyzing code...</span>
          </div>
        )}

        {error && (
          <div className="code-review-error">
            <FiAlertCircle size={16} />
            <span>{error}</span>
            <button onClick={performReview} className="code-review-retry">
              Retry
            </button>
          </div>
        )}

        {review && (
          <div className="code-review-content">
            {/* Score */}
            <div className="code-review-score">
              <div className="code-review-score-circle">
                <span className="code-review-score-value">{review.score}</span>
                <span className="code-review-score-label">/100</span>
              </div>
              <div className="code-review-score-details">
                <div className="code-review-score-summary">{review.summary}</div>
                <div className="code-review-score-stats">
                  {review.issues.length} issue{review.issues.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </div>

            {/* Issues */}
            {review.issues.length > 0 && (
              <div className="code-review-issues">
                <h4>Issues</h4>
                {review.issues.map((issue, index) => (
                  <div key={index} className="code-review-issue">
                    <div className="code-review-issue-header">
                      {getIssueIcon(issue.type)}
                      <span className="code-review-issue-type">{issue.type}</span>
                      <span
                        className="code-review-issue-severity"
                        style={{ color: getSeverityColor(issue.severity) }}
                      >
                        {issue.severity}
                      </span>
                      {issue.line && (
                        <span className="code-review-issue-line">Line {issue.line}</span>
                      )}
                    </div>
                    <div className="code-review-issue-message">{issue.message}</div>
                    {issue.code && (
                      <div className="code-review-issue-code">
                        <code>{issue.code}</code>
                      </div>
                    )}
                    {issue.suggestion && (
                      <div className="code-review-issue-suggestion">
                        <strong>💡 Suggestion:</strong> {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {review.suggestions.length > 0 && (
              <div className="code-review-suggestions">
                <h4>General Suggestions</h4>
                <ul>
                  {review.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {review.issues.length === 0 && (
              <div className="code-review-success">
                <FiCheckCircle size={24} />
                <span>No issues found! Code looks good.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

