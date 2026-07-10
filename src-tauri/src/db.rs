use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

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
