export function RememberSessionField() {
  return (
    <label className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
      <input
        name="remember"
        type="checkbox"
        defaultChecked
        className="mt-0.5 h-4 w-4 rounded border-zinc-300"
      />
      <span className="text-sm text-zinc-700">
        <span className="font-medium text-zinc-900">Mantener sesión iniciada</span>
        <span className="block text-zinc-500">Si lo desmarcas, la sesión se guardará solo como cookie de navegador.</span>
      </span>
    </label>
  );
}
