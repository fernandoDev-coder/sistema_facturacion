import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmails, contactHref } from "@/lib/beta-config";

const copy = {
  notice: {
    title: "Legal notice", email: contactEmails.legal,
    sections: [
      ["Service status", "FaktuDash is in beta before its commercial launch. Free access starts with registration and email confirmation. Pro and Premium early access can be requested by email."],
      ["Contact information", "Trading name: FaktuDash. Main domain: https://www.faktudash.com. Use the legal contact below for legal questions."],
      ["Purpose", "This site presents FaktuDash and provides access, when enabled, to a web application for managing clients, invoices, quotes, expenses and business information."],
      ["Beta access", "No real charges are made during the beta. Pro and Premium are shown as product references and early access options, without an active commercial subscription."],
      ["Acceptable use", "Users must use FaktuDash lawfully, enter accurate information and refrain from creating fraudulent documents, impersonating others or violating their rights."],
      ["Intellectual property", "The FaktuDash brand, design, text, code, interface and visual assets belong to their owner or are used with permission. Copying, distribution or commercial use requires prior permission."],
      ["Responsibility", "FaktuDash supports administrative work. Users are responsible for reviewing their documents' tax, legal and accounting accuracy and fulfilling the obligations applicable to their activity."],
      ["Updates", "This notice may be updated before the commercial launch to reflect the final service structure, terms and required legal information."],
    ],
  },
  privacy: {
    title: "Privacy policy", email: contactEmails.privacy,
    sections: [
      ["Controller", "FaktuDash acts as controller for the data needed to provide the private beta. Use the privacy contact below for questions."],
      ["Data processed", "We may process account information, email, profile name, user-entered company and client details, invoices, quotes, expenses, plan information and technical records necessary for security, authentication and operation."],
      ["Purposes", "Data is used to manage beta access, provide invoicing features, apply plan limits, provide support, improve stability and maintain security."],
      ["User-entered data", "Users decide which client, document and business data to enter. They must have an appropriate legal basis and review documents before sending them or using them for tax purposes."],
      ["Providers", "Technical providers may include Supabase for authentication and databases, Vercel for hosting and deployment, and Stripe for payment preparation or testing where applicable. Real payments are disabled during the beta."],
      ["Retention", "Data is retained while an account is active, while needed for the beta, or where required for legal obligations, security, incident resolution or legal claims."],
      ["Rights", "Where applicable, you can request access, rectification, erasure, objection, restriction and portability through the privacy contact below."],
      ["Changes before launch", "This policy may be updated before commercial launch to reflect new features, providers, terms or additional legal information."],
    ],
  },
  terms: {
    title: "Terms and conditions", email: contactEmails.support,
    sections: [
      ["Private beta service", "FaktuDash manages clients, invoices, quotes, expenses, company information and usage plans through a web application. The service is in beta and may change before commercial launch."],
      ["Plans", "The Free plan has usage limits. Pro and Premium may be shown as references or early access options; they do not imply active paid subscriptions during the beta."],
      ["Payments and cancellation", "Real payments are disabled during the beta. Stripe may remain configured for development or testing in preparation for a future commercial launch."],
      ["Acceptable use", "Users must use the application lawfully and review tax details, amounts, taxes and text in their documents."],
      ["Tax responsibility", "FaktuDash does not replace advice from an accountant, tax adviser or qualified professional. Users must check that their invoices, quotes, expenses, taxes and legal details meet the rules applicable to their activity."],
      ["Availability and changes", "The beta may contain errors, interruptions, feature changes or limit adjustments. We will try to inform affected users of relevant changes."],
      ["Data and security", "Users must protect their credentials and keep their account details up to date. Contact support below for assistance."],
    ],
  },
  cookies: {
    title: "Cookie policy", email: "",
    sections: [
      ["Cookie use", "FaktuDash uses necessary technical cookies for sign-in, security, basic preferences and application operation during the beta."],
      ["Technical cookies", "These may include Supabase authentication cookies, necessary session cookies and faktudash_locale to remember the selected language. A remembered session lasts up to 30 days; without this option it uses session cookies. Theme preferences and form drafts are stored locally on the device. Passwords and MFA codes are excluded from drafts."],
      ["Analytics and marketing", "FaktuDash currently uses no analytics, advertising, remarketing or commercial tracking cookies. A consent banner for unnecessary cookies is therefore not loaded."],
      ["Stripe", "Stripe may use its own cookies or similar technology if payments or external checkout pages are enabled in future. Real payments are disabled during the beta."],
      ["Management", "You can delete or block cookies and site storage in your browser settings. Blocking technical cookies may prevent parts of the application from working."],
    ],
  },
};

export function EnglishLegalPage({ kind }: { kind: keyof typeof copy }) {
  const page = copy[kind];
  return <LegalPage title={page.title} updatedAt="November 2026">
    {page.sections.map(([title, text]) => <LegalSection key={title} title={title}><p>{text}</p></LegalSection>)}
    {page.email ? <LegalSection title="Contact"><a href={contactHref(page.email)}>{page.email}</a></LegalSection> : null}
  </LegalPage>;
}
