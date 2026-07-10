mod commands;
mod db;

use tauri::Manager;

const SEED_RULESET: &str = include_str!("seed_ruleset.json");

fn seed_default_ruleset_if_empty(db: &db::Db) {
    let conn = db.0.lock().expect("DB-Lock fehlgeschlagen");
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM rulesets", [], |r| r.get(0))
        .unwrap_or(0);
    if count == 0 {
        let value: serde_json::Value =
            serde_json::from_str(SEED_RULESET).expect("Seed-Regelwerk ist kein gültiges JSON");
        let id = value["id"].as_str().unwrap_or("default");
        let name = value["name"].as_str().unwrap_or("Standard-Regelwerk");
        conn.execute(
            "INSERT INTO rulesets (id, name, data, is_active) VALUES (?1, ?2, ?3, 1)",
            rusqlite::params![id, name, SEED_RULESET],
        )
        .expect("Seed-Regelwerk konnte nicht gespeichert werden");
    }
}

/// Gemeinsamer Einstiegspunkt für Desktop (aus main.rs aufgerufen) und
/// Mobile/Android (von Tauri automatisch über #[mobile_entry_point] als
/// JNI-Einstiegspunkt der App gebunden). Die Datenbank wird erst im
/// `.setup()`-Hook initialisiert, weil erst dort über `app.path()` der
/// plattformkorrekte App-Datenpfad verfügbar ist (auf Desktop z.B.
/// %APPDATA%/AppData, auf Android das interne App-Verzeichnis).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("App-Datenverzeichnis konnte nicht ermittelt werden");
            let db = db::init_db(app_data_dir);
            seed_default_ruleset_if_empty(&db);
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_rulesets,
            commands::get_active_ruleset,
            commands::save_ruleset,
            commands::set_active_ruleset,
            commands::delete_ruleset,
            commands::list_characters,
            commands::save_character,
            commands::delete_character,
        ])
        .run(tauri::generate_context!())
        .expect("Fehler beim Starten der Tauri-Anwendung");
}
