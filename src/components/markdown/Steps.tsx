
import React from 'react';

interface StepProps {
  title?: string;
  children: React.ReactNode;
}

export const Step: React.FC<StepProps> = ({ title, children }) => {
  return (
    <div className="step-item">
      {title && <h4 className="step-title font-semibold mb-2">{title}</h4>}
      <div className="step-content">{children}</div>
    </div>
  );
};

interface StepsProps {
  children: React.ReactNode;
}

export const Steps: React.FC<StepsProps> = ({ children }) => {
  return (
    <div className="steps-container my-6">
      {children}
    </div>
  );
};
