/**
 * Plan Approval Component
 * Shows AI-generated plan and allows user to approve/edit steps before execution
 */

import { useState } from 'react';
import { FiCheck, FiX, FiEdit2, FiPlay, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { AgentPlan, AgentPlanStep } from '../services/ai/agent';
import './PlanApproval.css';

interface PlanApprovalProps {
  plan: AgentPlan;
  onApprove: (plan: AgentPlan) => void;
  onReject: () => void;
  onEditStep?: (stepId: string, newDescription: string) => void;
}

export function PlanApproval({ plan, onApprove, onReject, onEditStep }: PlanApprovalProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(plan.steps.map(s => s.id)));
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const startEditing = (step: AgentPlanStep) => {
    setEditingStep(step.id);
    setEditValue(step.description);
  };

  const saveEdit = (stepId: string) => {
    if (onEditStep && editValue.trim()) {
      onEditStep(stepId, editValue.trim());
    }
    setEditingStep(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setEditValue('');
  };

  return (
    <div className="plan-approval">
      <div className="plan-approval-header">
        <h3>AI-Generated Plan</h3>
        <div className="plan-approval-meta">
          {plan.estimatedTime && (
            <span className="plan-meta-item">
              ⏱️ ~{Math.ceil(plan.estimatedTime / 60)} min
            </span>
          )}
          {plan.filesToModify && plan.filesToModify.length > 0 && (
            <span className="plan-meta-item">
              📁 {plan.filesToModify.length} file{plan.filesToModify.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {plan.risks && plan.risks.length > 0 && (
        <div className="plan-risks">
          <strong>⚠️ Risks:</strong>
          <ul>
            {plan.risks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="plan-steps">
        {plan.steps.map((step, index) => (
          <div key={step.id} className="plan-step">
            <div className="plan-step-header">
              <button
                className="plan-step-toggle"
                onClick={() => toggleStep(step.id)}
              >
                {expandedSteps.has(step.id) ? (
                  <FiChevronDown size={16} />
                ) : (
                  <FiChevronRight size={16} />
                )}
              </button>
              <span className="plan-step-number">{index + 1}</span>
              <div className="plan-step-content">
                {editingStep === step.id ? (
                  <div className="plan-step-edit">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit(step.id);
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      autoFocus
                      className="plan-step-edit-input"
                    />
                    <div className="plan-step-edit-actions">
                      <button onClick={() => saveEdit(step.id)} className="plan-edit-save">
                        <FiCheck size={14} />
                      </button>
                      <button onClick={cancelEdit} className="plan-edit-cancel">
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="plan-step-description">{step.description}</span>
                    {onEditStep && (
                      <button
                        className="plan-step-edit-btn"
                        onClick={() => startEditing(step)}
                        title="Edit step"
                      >
                        <FiEdit2 size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>
              <span className={`plan-step-type plan-step-type-${step.type}`}>
                {step.type}
              </span>
            </div>
            {expandedSteps.has(step.id) && step.target && (
              <div className="plan-step-details">
                <div className="plan-step-detail">
                  <strong>Target:</strong> {step.target}
                </div>
                {step.dependencies && step.dependencies.length > 0 && (
                  <div className="plan-step-detail">
                    <strong>Depends on:</strong> {step.dependencies.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="plan-approval-actions">
        <button
          className="plan-approve-btn"
          onClick={() => onApprove(plan)}
        >
          <FiPlay size={16} />
          Execute Plan
        </button>
        <button
          className="plan-reject-btn"
          onClick={onReject}
        >
          <FiX size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
}

