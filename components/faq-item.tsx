export function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-950">{question}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{answer}</p>
    </article>
  );
}
