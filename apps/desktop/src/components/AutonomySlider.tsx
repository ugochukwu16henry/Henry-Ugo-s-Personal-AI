/**
 * Autonomy Slider Component
 * Allows users to choose between Tab, CMD+K, and Full Agent modes
 */

import { AutonomyLevel } from '../services/ai/agent';
import './AutonomySlider.css';

interface AutonomySliderProps {
  level: AutonomyLevel;
  onLevelChange: (level: AutonomyLevel) => void;
}

export function AutonomySlider({ level, onLevelChange }: AutonomySliderProps) {
  const levels = [
    { id: AutonomyLevel.TAB, label: 'Tab', description: 'Light assist - autocomplete only' },
    { id: AutonomyLevel.CMD_K, label: 'CMD+K', description: 'Targeted edit - single file changes' },
    { id: AutonomyLevel.FULL_AGENT, label: 'Full Agent', description: 'Fully autonomous - multi-file, multi-step' }
  ];

  return (
    <div className="autonomy-slider">
      <div className="autonomy-slider-label">Autonomy Level</div>
      <div className="autonomy-slider-buttons">
        {levels.map((lvl) => (
          <button
            key={lvl.id}
            className={`autonomy-slider-button ${level === lvl.id ? 'active' : ''}`}
            onClick={() => onLevelChange(lvl.id)}
            title={lvl.description}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
}

