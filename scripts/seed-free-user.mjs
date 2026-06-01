import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnvFile(".env.local");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const seedKind = process.argv[2] ?? "free";
const seedConfig = {
  free: {
    label: "gratis",
    envPrefix: "SEED_FREE_USER",
    plan: "starter",
    hasLifetimeAccess: false,
  },
  pro: {
    label: "pro",
    envPrefix: "SEED_PRO_USER",
    plan: "pro",
    hasLifetimeAccess: false,
  },
  premium: {
    label: "premium",
    envPrefix: "SEED_PREMIUM_USER",
    plan: "premium",
    hasLifetimeAccess: false,
  },
}[seedKind];

if (!seedConfig) {
  throw new Error("Uso: node scripts/seed-free-user.mjs free|pro|premium");
}

const emailKey = `${seedConfig.envPrefix}_EMAIL`;
const passwordKey = `${seedConfig.envPrefix}_PASSWORD`;
const email = env[emailKey];
const password = env[passwordKey];

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  [emailKey]: email,
  [passwordKey]: password,
})) {
  if (!value) {
    throw new Error(`Falta ${name} en .env.local.`);
  }
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let user = await findUserByEmail(email);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error && !/already|registered|exists/i.test(error.message)) {
    throw error;
  }

  user = data?.user ?? (await findUserByEmail(email));
}

if (!user) {
  throw new Error(`No se pudo crear o encontrar el usuario ${email}.`);
}

const { error: updateAuthError } = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});

if (updateAuthError) {
  throw updateAuthError;
}

const { error: profileError } = await admin.from("profiles").upsert(
  {
    id: user.id,
    email,
    role: "user",
    plan: seedConfig.plan,
    is_super_admin: false,
    has_lifetime_access: seedConfig.hasLifetimeAccess,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: null,
    subscription_current_period_end: null,
  },
  { onConflict: "id" },
);

if (profileError) {
  throw profileError;
}

await admin
  .from("subscriptions")
  .update({
    status: "canceled",
    cancel_at_period_end: true,
    updated_at: new Date().toISOString(),
  })
  .eq("owner_id", user.id);

console.log(`Usuario ${seedConfig.label} listo: ${email}`);
console.log(`Plan: ${seedConfig.plan}`);

async function findUserByEmail(targetEmail) {
  const normalized = targetEmail.trim().toLowerCase();
  let page = 1;

  while (page < 100) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const match = users.find((candidate) => candidate.email?.trim().toLowerCase() === normalized);

    if (match) {
      return match;
    }

    if (users.length < 100) {
      return null;
    }

    page += 1;
  }

  return null;
}

function loadEnvFile(path) {
  const absolutePath = resolve(path);

  if (!existsSync(absolutePath)) {
    throw new Error(`No existe ${path}.`);
  }

  return Object.fromEntries(
    readFileSync(absolutePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        const key = index === -1 ? line : line.slice(0, index);
        const rawValue = index === -1 ? "" : line.slice(index + 1);
        const value = rawValue.replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );
}
