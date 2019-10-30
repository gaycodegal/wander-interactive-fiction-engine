#include "../headers/fileio.hh"

FileIO::FileIO() {}

bool FileIO::isDir(const QString& source) {
  if (source.isEmpty()) {
    return false;
  }
    
  return QDir(source).exists();
}

bool FileIO::newDir(const QString& source) {
  QDir dir(source);
  if (dir.exists()) {
    return false;
  }

  dir.mkdir(source);

  return true;
}

bool FileIO::fileExists(const QString& source) {
  if (source.isEmpty()) {
    return false;
  }

  return QFile(source).exists();
}

bool FileIO::newFile(const QString& source, const QString& data) {
  if (source.isEmpty()) {
    return false;
  }

  QFile file(source);
  if (file.exists()) {
    return false;
  }

  if (!file.open(QFile::WriteOnly | QFile::Truncate)) {
    return false;
  }

  QTextStream out(&file);
  out << data;
  file.close();

  return true;
}
