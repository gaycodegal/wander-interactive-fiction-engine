#include <qt/QtGui/QGuiApplication>
#include <qt/QtGui/QIcon>
#include <qt/QtQml/QQmlApplicationEngine>
#include <qt/QtQml/QQmlContext>
#include <qt/QtQuickControls2/QQuickStyle>

#include "../headers/fileio.hh"

int main(int argc, char *argv[]) {
  QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);

  QGuiApplication app(argc, argv);
  app.setWindowIcon(QIcon("icons/wife.png"));
  QQuickStyle::setStyle("Material");
  QQmlApplicationEngine engine;

  FileIO fileIO;
  engine.rootContext()->setContextProperty("appDirPath", QGuiApplication::applicationDirPath());
  engine.rootContext()->setContextProperty("fileio", &fileIO);
  
  engine.load(QUrl(QStringLiteral("views/wife.qml")));

  return app.exec();
}
