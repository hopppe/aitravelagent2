import React, { forwardRef } from 'react';

// This component will be used to wrap the content we want to render to PDF
const PdfRenderer = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="pdf-container">
        {children}
      </div>
    );
  }
);

PdfRenderer.displayName = 'PdfRenderer';

export default PdfRenderer; 