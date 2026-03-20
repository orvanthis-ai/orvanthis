export function validatePrompt(input: unknown) {
  if (typeof input !== "string") {
    return {
      valid: false,
      message: "Prompt must be a string.",
    };
  }

  const trimmed = input.trim();

  if (!trimmed) {
    return {
      valid: false,
      message: "Prompt is required.",
    };
  }

  if (trimmed.length > 5000) {
    return {
      valid: false,
      message: "Prompt is too long.",
    };
  }

  return {
    valid: true,
    value: trimmed,
  };
}