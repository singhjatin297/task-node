type Status = "STARTED" | "IN PROGRESS" | "COMPLETED";

export interface Task {
  id?: string;
  title?: string;
  description?: string;
  status?: Status;
  isDeleted?: boolean;
}

export interface User {
  id: string;
  email: string;
  password: string;
}

export interface CustomError extends Error {
  statusCode?: number;
}

export class CustomErrorCode extends Error {
  statusCode: number;

  constructor(message: string, receivedStatusCode: number) {
    super(message);
    this.statusCode = receivedStatusCode;
  }
}
