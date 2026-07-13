import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { CharacterList } from "./components/CharacterList";
import { CharacterSheet } from "./components/CharacterSheet";
import { RulesManager } from "./components/RulesManager";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const { view, loadAll, loading } = useAppStore();

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <Layout>
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="font-display text-6xl text-pip-greendim animate-pulse">⟳</div>
          <p className="text-pip-greendim">Lade Daten…</p>
        </div>
      ) : (
        <>
          {view === "characters" && <CharacterList />}
          {view === "sheet" && <CharacterSheet />}
          {view === "rules" && <RulesManager />}
        </>
      )}
    </Layout>
  );
}
