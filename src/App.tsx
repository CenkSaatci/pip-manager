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
        <p className="text-pip-greendim">Terminal wird initialisiert…</p>
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
