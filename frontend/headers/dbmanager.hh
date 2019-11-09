#ifndef FRONTEND_HEADERS_DBMANAGER_HH_
#define FRONTEND_HEADERS_DBMANAGER_HH_

#include <qt/QtCore/QDebug>
#include <qt/QtCore/QStringList>
#include <qt/QtSql/QSqlDatabase>
#include <qt/QtSql/QSqlQuery>
#include <qt/QtSql/QSqlError>
#include <qt/QtSql/QSqlRecord>

class DbManager : public QObject {
  Q_OBJECT

 public:
  explicit DbManager(QObject* parent = Q_NULLPTR);
  Q_INVOKABLE bool open(const QString& path);
  Q_INVOKABLE void close();
  Q_INVOKABLE bool createTables();
  Q_INVOKABLE QStringList queryKeysOfTable(const QString& key_name,
                                           const QString& table);
  Q_INVOKABLE bool insertItem(const QString& name,
                              const QString& desc,
                              const QString& attrs,
                              const QString& comps);

 private:
  QString m_path;
  QSqlDatabase m_db;
};

#endif  // FRONTEND_HEADERS_DBMANAGER_HH_
