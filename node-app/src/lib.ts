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
