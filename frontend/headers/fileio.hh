#ifndef FRONTEND_HEADERS_FILEIO_HH_
#define FRONTEND_HEADERS_FILEIO_HH_

#include <qt/QtCore/QObject>
#include <qt/QtCore/QDebug>
#include <qt/QtCore/QDir>
#include <qt/QtCore/QFile>
#include <qt/QtCore/QTextStream>

class FileIO : public QObject {
  Q_OBJECT

 public slots:
  bool newDir(const QString& source);
  bool fileExists(const QString& source);
  bool newFile(const QString& source, const QString& data);

 public:
  FileIO();
};

#endif  // FRONTEND_HEADERS_FILEIO_HH_
