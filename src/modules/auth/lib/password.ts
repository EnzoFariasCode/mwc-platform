export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,20}$/;

export function validatePassword(password: string) {
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error:
        "A senha deve ter entre 8 e 20 caracteres, incluir letra maiúscula, minúscula e número/símbolo.",
    };
  }
  return { valid: true };
}
