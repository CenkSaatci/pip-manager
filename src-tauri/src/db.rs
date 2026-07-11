use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;
#[cfg(test)]
use std::fs;

pub struct Db(pub Mutex<Connection>);

/// Öffnet/erstellt die SQLite-Datenbank im übergebenen App-Datenverzeichnis.
/// Der Pfad wird vom Aufrufer über Tauris plattformübergreifenden Path-Resolver
/// ermittelt (funktioniert identisch auf Desktop UND Mobile/Android, im
/// Gegensatz zur `dirs`-Crate, die auf Android keine sinnvollen Pfade liefert).
pub fn init_db(app_data_dir: PathBuf) -> Db {
    std::fs::create_dir_all(&app_data_dir).ok();
    let db_file = app_data_dir.join("pip-manager.sqlite");
    let conn = Connection::open(db_file).expect("SQLite Datenbank konnte nicht geöffnet werden");
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS rulesets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ruleset_id TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        ",
    )
    .expect("Schema-Migration fehlgeschlagen");
    Db(Mutex::new(conn))
}

/// Prüft, ob ein gegebenes DB-File eine gültige rulesets-Tabelle hat.
pub fn verify_schema(db_file: &PathBuf) -> bool {
    match Connection::open(db_file) {
        Ok(conn) => {
            let count: Result<i64, _> = conn.query_row(
                "SELECT COUNT(*) FROM rulesets",
                [],
                |row| row.get(0),
            );
            count.is_ok()
        }
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_init_db_creates_tables() {
        let tmp = PathBuf::from("/tmp/pip_test_db");
        fs::create_dir_all(&tmp).ok();
        let db = init_db(tmp.join("test.sqlite"));
        let conn = db.0.lock().unwrap();
        // Tabellen sollten existieren
        let table_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('rulesets', 'characters')",
            [],
            |row| row.get(0),
        ).unwrap();
        assert_eq!(table_count, 2, "Beide Tabellen (rulesets, characters) müssen existieren");
        fs::remove_dir_all(&tmp).ok();
    }

    #[test]
    fn test_seed_ruleset_is_valid_json() {
        let seed = include_str!("seed_ruleset.json");
        let parsed: serde_json::Value = serde_json::from_str(seed)
            .expect("seed_ruleset.json muss gültiges JSON sein");
        assert!(parsed.get("id").and_then(|v| v.as_str()).is_some(), "seed muss eine id haben");
        assert!(parsed.get("name").and_then(|v| v.as_str()).is_some(), "seed muss einen name haben");
        assert!(parsed.get("skills").and_then(|v| v.as_array()).is_some(), "seed muss skills-Array haben");
        assert!(parsed.get("formulas").is_some(), "seed muss formulas haben");
    }

    #[test]
    fn test_insert_and_read_ruleset() {
        let tmp = PathBuf::from("/tmp/pip_test_rw");
        fs::create_dir_all(&tmp).ok();
        let db_path = tmp.join("rw.sqlite");

        // DB initialisieren
        let db = init_db(db_path.clone());
        let conn = db.0.lock().unwrap();

        // Ruleset einfügen
        let data = r#"{"test": true, "name": "Test"}"#;
        conn.execute(
            "INSERT INTO rulesets (id, name, data, is_active) VALUES (?1, ?2, ?3, 1)",
            rusqlite::params!["test-id", "Test", data],
        ).unwrap();

        // Auslesen
        let (read_name, read_data): (String, String) = conn.query_row(
            "SELECT name, data FROM rulesets WHERE id = ?1",
            rusqlite::params!["test-id"],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).unwrap();

        assert_eq!(read_name, "Test");
        assert_eq!(read_data, data);

        fs::remove_dir_all(&tmp).ok();
    }
}
