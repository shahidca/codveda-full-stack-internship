interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage = ({
  message,
  onRetry,
}: ErrorMessageProps) => {
  return (
    <div className="error-container">
      <h3>Something went wrong</h3>
      <p>{message}</p>

      {onRetry && (
        <button onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;