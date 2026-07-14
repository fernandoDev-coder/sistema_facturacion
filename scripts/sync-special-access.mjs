import { loadEnvFile, normalizeRequiredEmail, redactEmail, requireEnv } from "./admin-script-utils.mjs";

const env = loadEnvFile(".env.local");
const supabaseUrl = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
const accessAssignments = [
  {
    email: normalizeRequiredEmail(env, "SUPER_ADMIN_EMAIL"),
    access: {
      role: "super_admin",
      plan: "enterprise",
      is_super_admin: true,
      has_lifetime_access: true,
    },
  },
  {
    email: normalizeRequiredEmail(env, "LIFETIME_PREMIUM_EMAIL"),
    access: {
      role: "user",
      plan: "premium",
      is_super_admin: false,
      has_lifetime_access: true,
    },
  },
];

const { createClient } = await import("@supabase/supabase-js");
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = await listAllUsers();

for (const { email, access } of accessAssignments) {
  const user = users.find((candidate) => candidate.email?.trim().toLowerCase() === email);

  if (!user) {
    console.log(`${redactEmail(email)}: no existe en Auth; no se aplicaron cambios.`);
    continue;
  }

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email,
      ...access,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`No se pudo sincronizar una cuenta privilegiada: ${error.message}`);
  }

  console.log(`${redactEmail(email)}: acceso sincronizado.`);
}

async function listAllUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (data.users.length < 100) {
      return users;
    }

    page += 1;
  }
}

