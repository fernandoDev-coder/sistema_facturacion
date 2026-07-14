import {
  assertSafeSeedEnvironment,
  loadEnvFile,
  normalizeRequiredEmail,
  redactEmail,
  requireEnv,
  validatePrivatePassword,
} from "./admin-script-utils.mjs";

const env = loadEnvFile(".env.local");
const supabaseUrl = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
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
const email = normalizeRequiredEmail(env, emailKey);
const password = requireEnv(env, passwordKey);

validatePrivatePassword(password, passwordKey);
assertSafeSeedEnvironment(env, supabaseUrl);

const { createClient } = await import("@supabase/supabase-js");
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
  throw new Error("No se pudo crear o encontrar el usuario seed.");
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

console.log(`Usuario ${seedConfig.label} listo: ${redactEmail(email)}`);
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

