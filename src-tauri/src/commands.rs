use crate::db::Db;
use rusqlite::params;
use serde_json::Value;
use tauri::State;

fn get_str_field(v: &Value, field: &str) -> Result<String, String> {
    v.get(field)
        .and_then(|x| x.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("Feld '{field}' fehlt oder ist kein String"))
}

// --- RuleSets -------------------------------------------------------------

#[tauri::command]
pub fn list_rulesets(db: State<Db>) -> Result<Vec<Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT data FROM rulesets ORDER BY updated_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    let mut out = vec![];
    for r in rows {
        let json_str = r.map_err(|e| e.to_string())?;
        out.push(serde_json::from_str(&json_str).map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub fn get_active_ruleset(db: State<Db>) -> Result<Option<Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT data FROM rulesets WHERE is_active = 1 LIMIT 1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let json_str: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(Some(serde_json::from_str(&json_str).map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn save_ruleset(db: State<Db>, ruleset: Value) -> Result<(), String> {
    let id = get_str_field(&ruleset, "id")?;
    let name = get_str_field(&ruleset, "name")?;
    let data = serde_json::to_string(&ruleset).map_err(|e| e.to_string())?;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let exists_active: i64 = conn
        .query_row("SELECT COUNT(*) FROM rulesets", [], |r| r.get(0))
        .unwrap_or(0);
    let make_active = if exists_active == 0 { 1 } else { 0 };

    conn.execute(
        "INSERT INTO rulesets (id, name, data, is_active, updated_at)
         VALUES (?1, ?2, ?3, ?4, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET name = ?2, data = ?3, updated_at = datetime('now')",
        params![id, name, data, make_active],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_active_ruleset(db: State<Db>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE rulesets SET is_active = 0", [])
        .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE rulesets SET is_active = 1 WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_ruleset(db: State<Db>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM rulesets WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    // falls das aktive Regelwerk geloescht wurde, ein anderes aktivieren
    let remaining_active: i64 = conn
        .query_row("SELECT COUNT(*) FROM rulesets WHERE is_active = 1", [], |r| r.get(0))
        .unwrap_or(0);
    if remaining_active == 0 {
        conn.execute(
            "UPDATE rulesets SET is_active = 1 WHERE id = (SELECT id FROM rulesets LIMIT 1)",
            [],
        )
        .ok();
    }
    Ok(())
}

// --- Characters -------------------------------------------------------------

#[tauri::command]
pub fn list_characters(db: State<Db>) -> Result<Vec<Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT data FROM characters ORDER BY updated_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    let mut out = vec![];
    for r in rows {
        let json_str = r.map_err(|e| e.to_string())?;
        out.push(serde_json::from_str(&json_str).map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub fn save_character(db: State<Db>, character: Value) -> Result<(), String> {
    let id = get_str_field(&character, "id")?;
    let name = get_str_field(&character, "name")?;
    let ruleset_id = get_str_field(&character, "ruleSetId")?;
    let data = serde_json::to_string(&character).map_err(|e| e.to_string())?;
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO characters (id, name, ruleset_id, data, updated_at)
         VALUES (?1, ?2, ?3, ?4, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET name = ?2, ruleset_id = ?3, data = ?4, updated_at = datetime('now')",
        params![id, name, ruleset_id, data],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_character(db: State<Db>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM characters WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
