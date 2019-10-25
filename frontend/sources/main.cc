#include <qt/QtGui/QGuiApplication>
#include <qt/QtQml/QQmlApplicationEngine>
#include <qt/QtQuickControls2/QQuickStyle>

int main(int argc, char *argv[])
{
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);

    QGuiApplication app(argc, argv);
    QQuickStyle::setStyle("Material");
    
    QQmlApplicationEngine engine;
    engine.load(QUrl(QStringLiteral("views/wife.qml")));

    return app.exec();
}
