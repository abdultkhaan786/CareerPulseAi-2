import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cx } from "@/lib/format";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ id, label, error, hint, children, className }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; wrapperClass?: string };

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, error, hint, wrapperClass, className, id, ...rest },
  ref
) {
  const auto = useId();
  const fid = id || auto;
  return (
    <FieldShell id={fid} label={label} error={error} hint={hint} className={wrapperClass}>
      <input
        ref={ref}
        id={fid}
        className={cx("input", error && "input-error", className)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        {...rest}
      />
    </FieldShell>
  );
});

export function PasswordField(props: Omit<InputProps, "type">) {
  const [show, setShow] = useState(false);
  const auto = useId();
  const fid = props.id || auto;
  const { label, error, hint, wrapperClass, className, ...rest } = props;
  return (
    <FieldShell id={fid} label={label} error={error} hint={hint} className={wrapperClass}>
      <div className="relative">
        <input
          id={fid}
          type={show ? "text" : "password"}
          className={cx("input pr-11", error && "input-error", className)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted hover:text-ink"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FieldShell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; wrapperClass?: string };

export function SelectField({ label, error, wrapperClass, className, id, children, ...rest }: SelectProps) {
  const auto = useId();
  const fid = id || auto;
  return (
    <FieldShell id={fid} label={label} error={error} className={wrapperClass}>
      <select id={fid} className={cx("input appearance-auto pr-8", error && "input-error", className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: ReactNode; wrapperClass?: string };

export function TextAreaField({ label, error, hint, wrapperClass, className, id, ...rest }: TextAreaProps) {
  const auto = useId();
  const fid = id || auto;
  return (
    <FieldShell id={fid} label={label} error={error} hint={hint} className={wrapperClass}>
      <textarea
        id={fid}
        className={cx("input min-h-[120px] resize-y", error && "input-error", className)}
        aria-invalid={Boolean(error) || undefined}
        {...rest}
      />
    </FieldShell>
  );
}
