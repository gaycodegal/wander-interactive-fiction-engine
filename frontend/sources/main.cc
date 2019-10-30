#include <qt/QtGui/QGuiApplication>
#include <qt/QtQml/QQmlApplicationEngine>
#include <qt/QtQml/QQmlContext>
#include <qt/QtQuickControls2/QQuickStyle>

#include "../headers/fileio.hh"

int main(int argc, char *argv[]) {
  QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);

  QGuiApplication app(argc, argv);
  QQuickStyle::setStyle("Material");
  QQmlApplicationEngine engine;

  FileIO fileIO;
  engine.rootContext()->setContextProperty("fileio", &fileIO);
  
  engine.load(QUrl(QStringLiteral("views/wife.qml")));

  return app.exec();
}
