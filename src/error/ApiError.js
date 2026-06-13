class ApiError extends Error {
  constructor({ status, error, errorMessage }) {
    super(errorMessage);
    this.status = status;
    this.error = error;
    this.errorMessage = errorMessage;
  }
}

module.exports = ApiError;