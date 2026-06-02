import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEMO_MARKER = "DEMO_SCREENSHOT_SEED";
const env = loadEnvFile(".env.local");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] ?? env.SEED_PRO_USER_EMAIL;

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  SEED_PRO_USER_EMAIL: email,
})) {
  if (!value) {
    throw new Error(`Falta ${name} en .env.local o como argumento.`);
  }
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const user = await findUserByEmail(email);

if (!user) {
  throw new Error(`No existe el usuario ${email}. Ejecuta primero npm run seed:pro-user.`);
}

await ensureProProfile(user.id, email);
await seedCompany(user.id, email);
await clearExistingDemoData(user.id);

const clients = await seedClients(user.id);
await seedDocuments(user.id, clients);

console.log(`Datos demo listos para ${email}`);
console.log("Creados: 3 clientes, 4 facturas/presupuestos y sus lineas.");

async function ensureProProfile(userId, userEmail) {
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: userEmail,
      full_name: "Usuario Demo Pro",
      role: "user",
      plan: "pro",
      is_super_admin: false,
      has_lifetime_access: false,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function seedCompany(userId, userEmail) {
  const { error } = await admin.from("company_settings").upsert(
    {
      owner_id: userId,
      fiscal_name: "FaktuDash Studio",
      tax_id: "12345678Z",
      address: "Calle Gran Via 18, 3A",
      postal_code: "28013",
      city: "Madrid",
      province: "Madrid",
      email: userEmail,
      phone: "+34612345678",
      iban: "ES9121000418450200051332",
      invoice_footer: "Gracias por confiar en FaktuDash Studio.",
    },
    { onConflict: "owner_id" },
  );

  if (error) {
    throw error;
  }
}

async function clearExistingDemoData(userId) {
  const { data: demoInvoices, error: invoiceLookupError } = await admin
    .from("invoices")
    .select("id")
    .eq("owner_id", userId)
    .eq("notes", DEMO_MARKER);

  if (invoiceLookupError) {
    throw invoiceLookupError;
  }

  const invoiceIds = (demoInvoices ?? []).map((invoice) => invoice.id);

  if (invoiceIds.length) {
    const { error: itemsError } = await admin
      .from("invoice_items")
      .delete()
      .eq("owner_id", userId)
      .in("invoice_id", invoiceIds);

    if (itemsError) {
      throw itemsError;
    }
  }

  const { error: invoicesError } = await admin.from("invoices").delete().eq("owner_id", userId).eq("notes", DEMO_MARKER);

  if (invoicesError) {
    throw invoicesError;
  }

  const { error: clientsError } = await admin.from("communities").delete().eq("owner_id", userId).eq("notes", DEMO_MARKER);

  if (clientsError) {
    throw clientsError;
  }
}

async function seedClients(userId) {
  const rows = [
    {
      owner_id: userId,
      name: "Estudio Norte Creativo S.L.",
      tax_id: "B12345678",
      address: "Calle Serrano 42",
      postal_code: "28001",
      city: "Madrid",
      province: "Madrid",
      email: "administracion@estudionorte.demo",
      phone: "+34623456789",
      default_subject: "Servicios mensuales de gestion administrativa",
      default_vat: 21,
      notes: DEMO_MARKER,
    },
    {
      owner_id: userId,
      name: "Comunidad Jardines del Sur",
      tax_id: "H87654321",
      address: "Avenida de Andalucia 105",
      postal_code: "41007",
      city: "Sevilla",
      province: "Sevilla",
      email: "presidencia@jardinesdelsur.demo",
      phone: "+34634567890",
      default_subject: "Mantenimiento y soporte mensual",
      default_vat: 21,
      notes: DEMO_MARKER,
    },
    {
      owner_id: userId,
      name: "Talleres Rivas S.L.",
      tax_id: "B23456789",
      address: "Poligono Industrial La Vega, Nave 12",
      postal_code: "28521",
      city: "Rivas-Vaciamadrid",
      province: "Madrid",
      email: "contabilidad@talleresrivas.demo",
      phone: "+34645678901",
      default_subject: "Consultoria y automatizacion de procesos",
      default_vat: 21,
      notes: DEMO_MARKER,
    },
  ];

  const { data, error } = await admin.from("communities").insert(rows).select("*");

  if (error) {
    throw error;
  }

  return data;
}

async function seedDocuments(userId, clients) {
  const clientByName = new Map(clients.map((client) => [client.name, client]));
  const documents = [
    {
      client: clientByName.get("Estudio Norte Creativo S.L."),
      document_type: "invoice",
      invoice_number: "F-2026-001",
      invoice_date: "2026-06-01",
      subject: "Servicios mensuales de gestion administrativa",
      status: "paid",
      items: [
        ["Gestion documental y facturacion", 420],
        ["Soporte y seguimiento mensual", 180],
      ],
    },
    {
      client: clientByName.get("Comunidad Jardines del Sur"),
      document_type: "invoice",
      invoice_number: "F-2026-002",
      invoice_date: "2026-06-02",
      subject: "Mantenimiento y soporte mensual",
      status: "pending",
      items: [
        ["Administracion mensual de incidencias", 350],
        ["Revision de documentacion y reportes", 125],
      ],
    },
    {
      client: clientByName.get("Talleres Rivas S.L."),
      document_type: "budget",
      invoice_number: "P-2026-001",
      invoice_date: "2026-06-03",
      subject: "Automatizacion de procesos internos",
      status: "draft",
      items: [
        ["Analisis inicial y propuesta tecnica", 300],
        ["Configuracion de flujo de facturacion", 650],
        ["Sesion de formacion", 190],
      ],
    },
    {
      client: clientByName.get("Estudio Norte Creativo S.L."),
      document_type: "budget",
      invoice_number: "P-2026-002",
      invoice_date: "2026-06-04",
      subject: "Optimización de reporting financiero",
      status: "pending",
      items: [
        ["Diseno de informes y plantillas", 280],
        ["Implementacion y revision final", 520],
      ],
    },
  ];

  for (const document of documents) {
    await seedDocument(userId, document);
  }
}

async function seedDocument(userId, document) {
  const vatRate = 21;
  const amount = document.items.reduce((sum, [, itemAmount]) => sum + itemAmount, 0);
  const vatAmount = roundMoney(amount * (vatRate / 100));
  const total = roundMoney(amount + vatAmount);
  const date = new Date(`${document.invoice_date}T00:00:00.000Z`);

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .insert({
      owner_id: userId,
      community_id: document.client.id,
      document_type: document.document_type,
      community_name: document.client.name,
      community_tax_id: document.client.tax_id,
      community_address: document.client.address,
      community_postal_code: document.client.postal_code,
      community_city: document.client.city,
      community_province: document.client.province,
      community_email: document.client.email,
      community_phone: document.client.phone,
      invoice_number: document.invoice_number,
      invoice_date: document.invoice_date,
      month: date.getUTCMonth() + 1,
      year: date.getUTCFullYear(),
      subject: document.subject,
      amount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total,
      status: document.status,
      notes: DEMO_MARKER,
    })
    .select("id")
    .single();

  if (invoiceError) {
    throw invoiceError;
  }

  const items = document.items.map(([description, itemAmount], index) => {
    const itemVatAmount = roundMoney(itemAmount * (vatRate / 100));

    return {
      owner_id: userId,
      invoice_id: invoice.id,
      description,
      amount: itemAmount,
      vat_rate: vatRate,
      vat_amount: itemVatAmount,
      total: roundMoney(itemAmount + itemVatAmount),
      sort_order: index,
    };
  });

  const { error: itemError } = await admin.from("invoice_items").insert(items);

  if (itemError) {
    throw itemError;
  }
}

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

function roundMoney(value) {
  return Math.round(value * 100) / 100;
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
