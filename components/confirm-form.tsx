"use client";

import { buttonClass } from "@/components/button-styles";

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
        className={buttonClass({ variant: "danger", size: "sm", className })}
      >
        {label}
      </button>
    </form>
  );
}
