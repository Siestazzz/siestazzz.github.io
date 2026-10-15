PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0 CHECK(views >= 0)
);
CREATE TABLE IF NOT EXISTS totals (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  visits INTEGER NOT NULL DEFAULT 0,
  reads INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO totals(id) VALUES(1);
CREATE TABLE IF NOT EXISTS receipts (
  kind TEXT NOT NULL CHECK(kind IN ('visit','read')),
  subject TEXT NOT NULL,
  visitor TEXT NOT NULL,
  accepted_at INTEGER NOT NULL,
  PRIMARY KEY(kind,subject,visitor)
);
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TRIGGER IF NOT EXISTS receipt_insert AFTER INSERT ON receipts BEGIN
  UPDATE totals SET visits = visits + (NEW.kind = 'visit'), reads = reads + (NEW.kind = 'read') WHERE id = 1;
  UPDATE articles SET views = views + 1 WHERE id = NEW.subject AND NEW.kind = 'read';
END;
CREATE TRIGGER IF NOT EXISTS receipt_update AFTER UPDATE OF accepted_at ON receipts BEGIN
  UPDATE totals SET visits = visits + (NEW.kind = 'visit'), reads = reads + (NEW.kind = 'read') WHERE id = 1;
  UPDATE articles SET views = views + 1 WHERE id = NEW.subject AND NEW.kind = 'read';
END;
