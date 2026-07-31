import { useCallback, useRef, useState } from "react";
import {
  deleteAttachment,
  uploadAttachment,
  type AttachmentMeta,
} from "../lib/api";

/** Mesmo teto do servidor — aqui só para avisar antes de subir o arquivo. */
export const MAX_ATTACHMENTS = 5;

/** Item ainda subindo. Ganha um id provisório para poder ser listado e cancelado. */
export interface PendingUpload {
  tempId: string;
  name: string;
  size: number;
}

/**
 * Fila de anexos da próxima pergunta.
 *
 * O upload acontece na hora de anexar, não na hora de enviar: a extração de
 * um PDF passa pela IA e leva segundos, e fazer isso no clique de "enviar"
 * deixaria a mensagem travada sem explicação. Anexando antes, o tempo de
 * espera acontece enquanto o usuário ainda está escrevendo.
 */
export function useAttachments() {
  const [items, setItems] = useState<AttachmentMeta[]>([]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const counterRef = useRef(0);

  const clearError = useCallback(() => setError(null), []);

  const add = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError(null);

      // conta o que já existe e o que está subindo: sem isso, selecionar
      // vários de uma vez furaria o limite
      const room = MAX_ATTACHMENTS - items.length - pending.length;
      if (room <= 0) {
        setError(`Você pode anexar no máximo ${MAX_ATTACHMENTS} arquivos.`);
        return;
      }

      const accepted = files.slice(0, room);
      if (accepted.length < files.length) {
        setError(`Só cabem mais ${room} arquivo(s) nesta mensagem.`);
      }

      await Promise.all(
        accepted.map(async (file) => {
          counterRef.current += 1;
          const tempId = `subindo-${counterRef.current}`;
          setPending((list) => [
            ...list,
            { tempId, name: file.name, size: file.size },
          ]);

          try {
            const saved = await uploadAttachment(file);
            setItems((list) => [...list, saved]);
          } catch (err) {
            setError(
              err instanceof Error
                ? `${file.name}: ${err.message}`
                : `Não consegui anexar ${file.name}.`,
            );
          } finally {
            setPending((list) => list.filter((p) => p.tempId !== tempId));
          }
        }),
      );
    },
    [items.length, pending.length],
  );

  const remove = useCallback((id: string) => {
    setItems((list) => list.filter((item) => item.id !== id));
    // apagar no servidor é oportunista: se falhar, a varredura de órfãos
    // recolhe o registro mais tarde e o usuário não precisa saber
    void deleteAttachment(id).catch(() => {});
  }, []);

  /** Chamado após o envio: os anexos passaram a pertencer à mensagem. */
  const clear = useCallback(() => {
    setItems([]);
    setError(null);
  }, []);

  /**
   * Repõe a fila com anexos devolvidos pelo "Parar". Continuam válidos porque
   * o servidor os desvincula da mensagem em vez de apagá-los.
   */
  const restore = useCallback((list: AttachmentMeta[]) => {
    setItems(list);
    setError(null);
  }, []);

  return {
    items,
    pending,
    error,
    clearError,
    add,
    remove,
    clear,
    restore,
    uploading: pending.length > 0,
    full: items.length + pending.length >= MAX_ATTACHMENTS,
  };
}
