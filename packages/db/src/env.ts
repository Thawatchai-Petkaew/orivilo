/** A required variable is missing. The message names it and never carries any value. */
export class MissingEnvError extends Error {
  readonly variable: string;
  constructor(variable: string) {
    super(`${variable} is not set; see .env.example for what it holds and where it is set`);
    this.name = "MissingEnvError";
    this.variable = variable;
  }
}

export function requireEnv(name: string, env: Record<string, string | undefined> = process.env) {
  const value = env[name];
  if (value === undefined || value.trim() === "") throw new MissingEnvError(name);
  return value;
}
