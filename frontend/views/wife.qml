import QtQuick 2.9
import QtQuick.Window 2.3
import QtQuick.Controls 2.5
import QtQuick.Layouts 1.3
import QtQuick.Controls.Material 2.3
import Qt.labs.settings 1.1

import DbManager 1.0

import "Menubar"
import "Sidebar"

ApplicationWindow {
    id: window
    property bool windowed: true
    visible: true
    width: 140
    height: 480
    title: "WIFE"
    Material.theme: Material.Dark

    Settings {
	id: settings
	property string lastFolderString;
	property url lastFolderURL;
	property string recentFiles;
	property string recentProjects;
	property string openProject;
	property string openProjectPath;
    }

    DbManager {
	id: game
    }
    
    menuBar: WifeMenuBar {}
    SideBar {id: sideBar }
}
