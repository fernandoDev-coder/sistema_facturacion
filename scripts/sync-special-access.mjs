import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const specialAccounts = new Map([
  [
    "fernandolaramillan@gmail.com",
    {
      role: "super_admin",
      plan: "enterprise",
      is_super_admin: true,
      has_lifetime_access: true,
    },
  ],
  [
    "jandry38@hotmail.es",
    {
      role: "user",
      plan: "premium",
      is_super_admin: false,
      has_lifetime_access: true,
    },
  ],
]);

loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = await listAllUsers();

for (const [email, access] of specialAccounts) {
  const user = users.find((candidate) => candidate.email?.trim().toLowerCase() === email);

  if (!user) {
    console.log(`${email}: no existe en Auth; se sincronizara cuando se registre.`);
    continue;
  }

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? email,
      ...access,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`${email}: ${error.message}`);
  }

  console.log(`${email}: sincronizado como ${access.role} con plan ${access.plan}.`);
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

function loadEnvFile(path) {
  const envPath = resolve(path);
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}
