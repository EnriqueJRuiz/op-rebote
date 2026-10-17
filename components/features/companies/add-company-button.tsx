"use client";

import { FormEvent, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  addSelectedCompanyAction,
  searchCompanyToAddAction,
} from "@/app/actions/add-company";
import { CompanySearchMatch } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

type FeedbackTone = "error" | "info" | "success";

export function AddCompanyButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CompanySearchMatch[]>([]);
  const [matchesAlreadySaved, setMatchesAlreadySaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTone, setDialogTone] = useState<FeedbackTone>("info");
  const [notice, setNotice] = useState("");
  const router = useRouter();

  const openDialog = () => {
    setQuery("");
    setMatches([]);
    setMatchesAlreadySaved(false);
    setDialogMessage("");
    setNotice("");
    setOpen(true);
  };

  const closeDialog = () => {
    if (busy) return;
    setOpen(false);
  };

  const finishAdding = (name: string) => {
    setOpen(false);
    setNotice(UI_TEXT.pages.companies.addSuccess(name));
    setMatches([]);
    setQuery("");
    router.refresh();
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      setDialogTone("error");
      setDialogMessage(UI_TEXT.pages.companies.addEmptyQuery);
      return;
    }

    setBusy("search");
    setDialogMessage("");
    setMatches([]);
    try {
      const result = await searchCompanyToAddAction(query);
      if (result.status === "added") {
        finishAdding(result.nombre);
      } else if (result.status === "already_exists") {
        setMatches(result.matches);
        setMatchesAlreadySaved(true);
        setDialogTone("info");
        setDialogMessage(UI_TEXT.pages.companies.addAlreadyExists);
      } else if (result.status === "matches") {
        setMatches(result.matches);
        setMatchesAlreadySaved(false);
      } else if (result.status === "not_found") {
        setDialogTone("info");
        setDialogMessage(UI_TEXT.pages.companies.addNotFound);
      } else if (result.status === "empty") {
        setDialogTone("error");
        setDialogMessage(UI_TEXT.pages.companies.addEmptyQuery);
      } else {
        setDialogTone("error");
        setDialogMessage(UI_TEXT.pages.companies.addSearchError);
      }
    } catch {
      setDialogTone("error");
      setDialogMessage(UI_TEXT.pages.companies.addSearchError);
    } finally {
      setBusy(null);
    }
  };

  const handleAddMatch = async (match: CompanySearchMatch) => {
    setBusy(match.ticker);
    setDialogMessage("");
    try {
      const result = await addSelectedCompanyAction(match.ticker);
      if (result.status === "added") {
        finishAdding(result.nombre);
      } else if (result.status === "already_exists") {
        setMatches(result.matches);
        setMatchesAlreadySaved(true);
        setDialogTone("info");
        setDialogMessage(UI_TEXT.pages.companies.addAlreadyExists);
      } else if (result.status === "invalid") {
        setDialogTone("error");
        setDialogMessage(UI_TEXT.pages.companies.addInvalid);
      } else {
        setDialogTone("error");
        setDialogMessage(UI_TEXT.pages.companies.addSearchError);
      }
    } catch {
      setDialogTone("error");
      setDialogMessage(UI_TEXT.pages.companies.addSearchError);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        type="button"
        onClick={openDialog}
        className={UI_STYLES.button.primaryFull}
      >
        <Plus size={16} aria-hidden="true" />
        {UI_TEXT.pages.companies.addButton}
      </button>
      {notice && <p className="text-right text-sm text-emerald-700" role="status">{notice}</p>}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-company-title"
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="add-company-title" className="text-lg font-bold text-slate-900">
                  {UI_TEXT.pages.companies.addTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {UI_TEXT.pages.companies.addDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={busy !== null}
                aria-label={UI_TEXT.pages.companies.addClose}
                title={UI_TEXT.pages.companies.addClose}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="p-5">
              <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  autoFocus
                  maxLength={120}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={UI_TEXT.pages.companies.addPlaceholder}
                  aria-label={UI_TEXT.pages.companies.addPlaceholder}
                  className={`${UI_STYLES.filter.input} min-w-0 flex-1`}
                />
                <button
                  type="submit"
                  disabled={busy !== null || !query.trim()}
                  className={UI_STYLES.button.primary}
                >
                  <Search size={16} aria-hidden="true" />
                  {busy === "search"
                    ? UI_TEXT.pages.companies.addSearching
                    : UI_TEXT.pages.companies.addSearch}
                </button>
              </form>

              {dialogMessage && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-4 text-sm ${dialogTone === "error" ? "text-rose-700" : "text-slate-600"}`}
                >
                  {dialogMessage}
                </p>
              )}

              {matches.length > 0 && (
                <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-200">
                  {matches.map((match) => (
                    <li key={match.ticker} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{match.nombre}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          <span className="font-mono">{match.ticker}</span>
                          {match.bolsa && ` · ${match.bolsa}`}
                        </p>
                      </div>
                      {matchesAlreadySaved ? (
                        <span className="shrink-0 text-xs font-medium text-slate-500">
                          {UI_TEXT.pages.companies.addAlreadySavedLabel}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleAddMatch(match)}
                          disabled={busy !== null}
                          className={UI_STYLES.button.primary}
                        >
                          <Plus size={15} aria-hidden="true" />
                          {busy === match.ticker
                            ? UI_TEXT.pages.companies.addSaving
                            : UI_TEXT.pages.companies.addSelect}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}