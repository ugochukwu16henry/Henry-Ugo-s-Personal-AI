/**
 * Diff Viewer Modal/Overlay Component
 * Wrapper for displaying diff previews in a modal
 */

import { DiffPreview, DiffPreviewProps } from './DiffPreview';

export interface DiffViewerProps extends DiffPreviewProps {
  isOpen: boolean;
  title?: string;
}

/**
 * Diff Viewer Modal
 * Shows diff in a modal overlay
 */
export function DiffViewer({
  isOpen,
  title = 'Code Changes Preview',
  ...diffProps
}: DiffViewerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget && diffProps.onClose) {
          diffProps.onClose();
        }
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '1400px',
          height: '90%',
          maxHeight: '900px',
          background: '#1e1e1e',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {title && (
          <div
            style={{
              padding: '1rem 1.5rem',
              background: '#252526',
              borderBottom: '1px solid #3e3e42',
              fontSize: '1.1rem',
              fontWeight: 500,
              color: '#cccccc'
            }}
          >
            {title}
          </div>
        )}

        {/* Diff Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <DiffPreview {...diffProps} />
        </div>
      </div>
    </div>
  );
}

