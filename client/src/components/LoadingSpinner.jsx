const LoadingSpinner = ({ full = false }) => (
  <div className={full ? 'loading-screen' : 'text-center py-4'}>
    <div className="loading-shell" role="status" aria-live="polite" aria-label="Loading interface">
      <div className="spinner-border loading-icon" aria-hidden="true" />
      <p className="loading-copy mb-0">Loading interface</p>
    </div>
  </div>
);

export default LoadingSpinner;
