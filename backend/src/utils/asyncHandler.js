// Wrapper для async route handlers
// Автоматически ловит ошибки и передает в error handler middleware
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
