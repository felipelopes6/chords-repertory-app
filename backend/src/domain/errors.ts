export class ExternalServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'ExternalServiceError';
    this.statusCode = statusCode;
  }
}

export class ResourceNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}
