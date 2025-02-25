// Error classes for specific use cases

export class ApiError extends Error {
  statusCode: number;
  details: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class LoggerError extends Error {
  details: any | undefined = undefined;

  constructor(message: string = '', name: string = 'LoggerError', details?: any) {
    super(message);
    this.name = name;
    this.details = details;
  }
}
