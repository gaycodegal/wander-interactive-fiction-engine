#ifndef FILEIO_HH
#define FILEIO_HH

#include <qt/QtCore/QObject>
#include <qt/QtCore/QDir>

class FileIO : public QObject {
  Q_OBJECT

public slots:
  bool isDir(const QString& source) {
    if (source.isEmpty()) {
      return false;
    }
    
    return QDir(source).exists();
  }

  bool newDir(const QString& source) {
    if (source.isEmpty()) {
      return false;
    }

    QDir dir(source);
    if (dir.exists()) {
      return false;
    }

    dir.mkdir(source);

    return true;
  }

public:
  FileIO();
};

#endif //FILEIO_HH
