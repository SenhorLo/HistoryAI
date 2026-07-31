import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Alert } from "../ui/Alert";
import { updateDisplayName } from "../../lib/api";
import { saveDisplayName } from "../../lib/auth";
import { DISPLAY_NAME_MAX, displayNameFailure } from "../../lib/validation";

interface Props {
  /** sugestão inicial — o prefixo do e-mail, que é o que aparecia antes */
  suggestion: string;
  onDone: (name: string | null) => void;
}

/**
 * Pergunta como o usuário quer ser chamado, na primeira vez que ele entra no
 * chat sem nome definido.
 *
 * Usa o <dialog> nativo com showModal(): armadilha de foco, Escape para
 * fechar e o resto da página inerte vêm de graça do navegador, sem
 * reimplementar nada disso à mão.
 */
export default function DisplayNameDialog({ suggestion, onDone }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(suggestion);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  function close(result: string | null) {
    dialogRef.current?.close();
    onDone(result);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const issue = displayNameFailure(name);
    if (issue) {
      setFieldError(issue);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await updateDisplayName(name.trim());
      saveDisplayName(saved.displayName);
      close(saved.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="nome-titulo"
      // Escape fecha o dialog nativo direto no DOM; sem isto o React não
      // saberia que ele fechou e o diálogo voltaria no próximo render
      onCancel={(e) => {
        e.preventDefault();
        close(null);
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card border border-subtle bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <form onSubmit={handleSubmit} noValidate className="p-6">
        <h2 id="nome-titulo" className="text-2xl font-bold mb-1">
          Como você quer ser chamado?
        </h2>
        <p className="ui-text text-sm text-ink-muted mb-5">
          É assim que o HistoryAI vai te cumprimentar. Dá para mudar depois.
        </p>

        <Field
          label="Seu nome"
          value={name}
          autoFocus
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="nickname"
          onChange={(e) => {
            setName(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          error={fieldError ?? undefined}
          placeholder="Lorenzo"
        />

        {error && <Alert className="mb-4">{error}</Alert>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => close(null)}
            disabled={saving}
          >
            Agora não
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
