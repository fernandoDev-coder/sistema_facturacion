"use client";

type ConfirmFormProps = {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  message: string;
  className?: string;
};

export function ConfirmForm({ action, id, label, message, className = "" }: ConfirmFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={`text-sm font-medium text-red-700 hover:text-red-900 ${className}`}
      >
        {label}
      </button>
    </form>
  );
}
