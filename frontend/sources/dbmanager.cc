#include "../headers/dbmanager.hh"

bool runQuery(QString stmt) {
  QSqlQuery query;
  query.prepare(stmt);

  if (!query.exec()) {
    return false;
  }

  qDebug() << "runQuery: " << query.lastError();

  return true;
}

DbManager::DbManager(QObject* parent) {}

Q_INVOKABLE bool DbManager::open(const QString& path) {
  this->m_db = QSqlDatabase::addDatabase("QSQLITE");
  this->m_db.setDatabaseName(path);

  if (!this->m_db.isValid()) {
    qDebug() << "failing valid";
    return false;
  }

  if (!this->m_db.open()) {
    qDebug() << "failing open: " << path << this->m_db.lastError();;
    return false;
  }

  if (!runQuery("PRAGMA foreign_keys = ON;")) {
    qDebug() << "failing pragma";
    qDebug() << this->m_db.lastError();
    return false;
  }

  return true;
}

Q_INVOKABLE void DbManager::close() {
  this->m_db.close();
}

Q_INVOKABLE bool DbManager::createTables() {
  QString create_table = "CREATE TABLE IF NOT EXISTS ";
  QString create_index = "CREATE UNIQUE INDEX ";
  QStringList statements = {
                 create_table + "characters(name TEXT PRIMARY KEY, "
                 + "components TEXT);",
                 create_index + "character_names ON characters (name);",
                 create_table + "dialogues(character_name TEXT, fla"
                 + "gs TEXT, location TEXT, dialogue TEXT, PRIMARY KEY(characte"
                 + "r_name, flags, location), FOREIGN KEY(character_name) REFER"
                 + "ENCES characters(name), FOREIGN KEY(location) REFERENCES lo"
                 + "cations(name));",
                 create_index + "dialogue_trees ON dialogues (character_name, f"
                 + "lags, location);",
                 create_table + "items(name TEXT PRIMARY KEY, descr"
                 + "iption TEXT, attributes TEXT, components TEXT);",
                 create_index + "item_names ON items (name);",
                 create_table + "locations(name TEXT PRIMARY KEY, d"
                 + "escription TEXT, items TEXT, neighbors TEXT, characters TEX"
                 + "T);",
                 create_index + "location_names ON locations (name);"
  };

  for (auto statement : statements) {
    qDebug() << "stmt: " << statement;
    if (!runQuery(statement)) return true;
  }

  return true;
}

Q_INVOKABLE QStringList DbManager::queryKeysOfTable(
                                                    const QString& key_name,
                                                    const QString& table) {
  QStringList items;

  QString query_string = "SELECT * FROM " + table;
  QSqlQuery query(query_string);
  int idName = query.record().indexOf(key_name);

  while (query.next()) {
    QString name = query.value(idName).toString();
    items << name;
  }

  return items;
}

Q_INVOKABLE bool DbManager::insertItem(const QString& name,
                                       const QString& desc,
                                       const QString& attrs,
                                       const QString& comps) {
  QSqlQuery query;
  query.prepare("INSERT INTO items VALUES (:name, :desc, :attrs, :comps)");
  query.bindValue(":name", name);
  query.bindValue(":desc", desc);
  query.bindValue(":attrs", attrs);
  query.bindValue(":comps", comps);

  if (!query.exec()) {
    qDebug() << query.lastError();
    return false;
  }

  return true;
}

