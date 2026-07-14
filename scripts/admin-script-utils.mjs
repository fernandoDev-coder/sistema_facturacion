import { existsSync, readFileSync } from "node:fs";
import { hostname } from "node:os";
import { resolve } from "node:path";

const appEnvAllowList = new Set(["development", "test"]);

export function loadEnvFile(path = ".env.local") {
  const absolutePath = resolve(path);

  if (!existsSync(absolutePath)) {
    return { ...process.env };
  }

  const fileEnv = Object.fromEntries(
    readFileSync(absolutePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        const key = index === -1 ? line : line.slice(0, index).trim();
        const rawValue = index === -1 ? "" : line.slice(index + 1).trim();
        const value = rawValue.replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );

  return { ...fileEnv, ...process.env };
}

export function requireEnv(env, key) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Falta ${key} en variables privadas.`);
  }

  return value;
}

export function normalizeRequiredEmail(env, key) {
  const value = requireEnv(env, key).trim().toLowerCase();

  return normalizeEmailValue(value, key);
}

export function normalizeEmailValue(value, label = "email") {
  const normalized = value.trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    throw new Error(`${label} no tiene formato de email valido.`);
  }

  return normalized;
}

export function validatePrivatePassword(password, key) {
  if (password.length < 12) {
    throw new Error(`${key} debe tener al menos 12 caracteres.`);
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error(`${key} debe incluir mayusculas, minusculas, numeros y simbolos.`);
  }
}

export function assertSafeSeedEnvironment(env, supabaseUrl) {
  if (env.NODE_ENV === "production") {
    throw new Error("Los seeds estan bloqueados con NODE_ENV=production.");
  }

  if (env.ALLOW_SEED_DATA !== "true") {
    throw new Error("Define ALLOW_SEED_DATA=true para ejecutar seeds.");
  }

  if (!appEnvAllowList.has(env.APP_ENV ?? "")) {
    throw new Error("APP_ENV debe ser development o test para ejecutar seeds.");
  }

  const project = getSupabaseProjectIdentifier(supabaseUrl);
  const expectedProject = env.CONFIRM_SEED_PROJECT?.trim();

  console.log(`Seed target: ${project.id} (${project.host}) desde ${hostname()}.`);

  if (expectedProject && expectedProject !== project.id && expectedProject !== project.host) {
    throw new Error("CONFIRM_SEED_PROJECT no coincide con el proyecto Supabase configurado.");
  }

  return project;
}

export function getSupabaseProjectIdentifier(supabaseUrl) {
  let parsed;

  try {
    parsed = new URL(supabaseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no es una URL valida.");
  }

  const host = parsed.host.toLowerCase();
  const id = host.endsWith(".supabase.co") ? host.split(".")[0] : host;

  return { id, host };
}

export function redactEmail(email) {
  const [local, domain] = email.split("@");
  const visibleLocal = local.length <= 2 ? `${local[0] ?? ""}***` : `${local.slice(0, 2)}***`;
  return `${visibleLocal}@${domain}`;
}
