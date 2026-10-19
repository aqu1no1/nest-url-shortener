export interface ProblemDetailsFieldError {
  field: string;
  messages: string[];
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ProblemDetailsFieldError[];
}
