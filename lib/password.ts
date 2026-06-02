export function validatePassword(password: string) {
  if (password.length < 10) {
    return "La contrasena debe tener al menos 10 caracteres.";
  }

  if (!/[A-Z]/.test(password)) {
    return "La contrasena debe incluir al menos una mayuscula.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contrasena debe incluir al menos un simbolo.";
  }

  return null;
}
