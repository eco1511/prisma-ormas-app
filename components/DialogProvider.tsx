"use client";
import { createContext, useContext, useRef, useState } from "react";
import { Modal } from "./Modal";
type Kind = "alert" | "confirm" | "prompt";
type Request = { kind: Kind; message: string; resolve: (value: string | boolean | null) => void };
type Dialogs = { alert: (message: string) => Promise<void>; confirm: (message: string) => Promise<boolean>; prompt: (message: string) => Promise<string | null> };
const Context = createContext<Dialogs | null>(null);
export function useDialog() { const value = useContext(Context); if (!value) throw Error("DialogProvider diperlukan."); return value; }
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [value, setValue] = useState("");
  const queue = useRef<Request[]>([]);
  const active = useRef(false);
  function next() { const item = queue.current.shift() || null; active.current = Boolean(item); setValue(""); setRequest(item); }
  function ask(kind: Kind, message: string) { return new Promise<string | boolean | null>(resolve => { queue.current.push({ kind, message, resolve }); if (!active.current) next(); }); }
  function finish(result: string | boolean | null) { request?.resolve(result); next(); }
  const dialogs: Dialogs = {
    alert: async message => { await ask("alert", message); },
    confirm: async message => (await ask("confirm", message)) === true,
    prompt: async message => await ask("prompt", message) as string | null,
  };
  return <Context.Provider value={dialogs}>{children}{request && <Modal title={request.kind === "alert" ? "Informasi" : request.kind === "confirm" ? "Konfirmasi" : "Catatan Pemeriksaan"} onClose={() => finish(request.kind === "confirm" ? false : null)}>
    <form onSubmit={e => { e.preventDefault(); finish(request.kind === "prompt" ? value : true); }}>
      <p id="dialog-message" className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.message}</p>
      {request.kind === "prompt" && <textarea autoFocus aria-label="Catatan pemeriksaan" aria-describedby="dialog-message" className="input mt-4 min-h-28" value={value} onChange={e => setValue(e.target.value)}/>}
      <div className="mt-6 flex justify-end gap-3">{request.kind !== "alert" && <button type="button" autoFocus={request.kind === "confirm"} className="btn-secondary" onClick={() => finish(request.kind === "confirm" ? false : null)}>Batal</button>}<button type="submit" autoFocus={request.kind === "alert"} className="btn-primary">{request.kind === "alert" ? "Mengerti" : "Lanjutkan"}</button></div>
    </form>
  </Modal>}</Context.Provider>;
}
