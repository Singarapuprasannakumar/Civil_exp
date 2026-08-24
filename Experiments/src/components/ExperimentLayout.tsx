import React from 'react';

export const ExperimentLayout: React.FC<any> = ({ onBack }) => {
  return (
    <div className="p-4">
      <button onClick={onBack} className="text-blue-600 font-bold">← Back</button>
    </div>
  );
};
