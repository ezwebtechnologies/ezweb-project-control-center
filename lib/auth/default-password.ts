const FALLBACK_DEFAULT_EMPLOYEE_PASSWORD = "Welcome@123";

export function getDefaultEmployeePassword(): string {
  const fromEnv = process.env.DEFAULT_EMPLOYEE_PASSWORD?.trim();
  return fromEnv || FALLBACK_DEFAULT_EMPLOYEE_PASSWORD;
}
