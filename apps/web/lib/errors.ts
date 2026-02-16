export const getErrorMessage = (error: unknown) => {
  if (!error) return "Unknown error"
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message

  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === "string") return maybeMessage
  }

  return "Unexpected error"
}