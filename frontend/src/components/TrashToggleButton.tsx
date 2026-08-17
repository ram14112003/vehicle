// components/TrashToggleButton.tsx
import React from 'react';
import CommonButton from './CommonButton';

interface TrashToggleButtonProps {
  showTrashed: boolean;
  onToggle: () => void;
  className?: string;
}

const TrashToggleButton: React.FC<TrashToggleButtonProps> = ({
  showTrashed,
  onToggle,
  className = '',
}) => {
  return (
    <CommonButton
      onClick={onToggle}
      variant={showTrashed ? 'success' : 'danger'}
      className={`w-full sm:w-auto min-w-[160px] ${className}`}
    >
      {showTrashed ? 'Show Active' : 'Trashed Entries'}
    </CommonButton>
  );
};

export default TrashToggleButton;
