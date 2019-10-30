#ifndef FILEIO_HH
#define FILEIO_HH

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

#endif //FILEIO_HH
