const english: Record<string, string> = {
  "Introduce email y contraseña.": "Enter your email and password.",
  "Introduce un email válido.": "Enter a valid email address.",
  "Tu email aún no está verificado. Revisa tu bandeja de entrada y confirma tu cuenta.": "Your email is not verified yet. Check your inbox and confirm your account.",
  "Email o contraseña incorrectos.": "Incorrect email or password.",
  "No se pudo iniciar sesión. Inténtalo de nuevo.": "Could not sign in. Please try again.",
  "No se pudo completar la autenticación. Inténtalo de nuevo.": "Authentication could not be completed. Please try again.",
  "Las contraseñas no coinciden.": "Passwords do not match.",
  "La contrasena debe tener al menos 10 caracteres.": "Your password must contain at least 10 characters.",
  "La contrasena debe incluir al menos una mayuscula.": "Your password must contain at least one uppercase letter.",
  "La contrasena debe incluir al menos un simbolo.": "Your password must contain at least one symbol.",
  "Cuenta creada. Revisa tu email y confirma tu dirección antes de iniciar sesión.": "Account created. Check your email and confirm your address before signing in.",
  "Indica el email al que quieres reenviar la verificación.": "Enter the email address for the verification message.",
  "Te hemos reenviado el email de verificación.": "We have resent the verification email.",
  "Introduce el email de tu cuenta.": "Enter your account email.",
  "Si existe una cuenta con ese email, te enviaremos un enlace para crear una nueva contraseña.": "If an account exists for this email, we will send a link to create a new password.",
  "El enlace de recuperación ha caducado o no es válido. Solicita uno nuevo.": "The recovery link has expired or is invalid. Request a new one.",
  "No se pudo validar el enlace. Solicita uno nuevo.": "Could not validate the link. Request a new one.",
  "Contraseña actualizada. Ya puedes iniciar sesión.": "Password updated. You can now sign in.",
  "No se pudo cerrar la sesión. Inténtalo de nuevo.": "Could not sign out. Please try again.",
};

export function translateMessage(text: string, locale: string) {
  return locale === "en" ? english[text] ?? text : text;
}
