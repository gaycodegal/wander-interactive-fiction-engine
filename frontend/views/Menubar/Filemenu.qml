import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12
import QtQuick.Dialogs 1.2
import Qt.labs.settings 1.0

Menu {
    id: fileMenu
    title: "File"
    width: 300

    Settings {
	id: settings
	property string lastFolderString;
	property url lastFolderURL;
    }
    
    MenuItem {
	action: Action {
	    id: exitAction
	    text: "Exit"
	    icon.name: "exit-run"
	    icon.source: "../../icons/exit-run.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Q"
	    onTriggered: Qt.quit()
	}
	text: "Ctrl+Q"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    id: newProjectAction
	    text: "New Project"
	    icon.name: "folder-plus-outline"
	    icon.source: "../../icons/folder-plus-outline.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+N"
	    onTriggered: {
		console.log("file:///" + appDirPath + "/projects");
		fileio.newDir("file:///" + appDirPath + "/projects");
		fileio.newFile("file:///" + appDirPath + "/immutable_game.db", "");
	    }
	}
	text: "Ctrl+N"

	contentItem: Menuitem {}
    }

    FileDialog {
	id: openProject
	title: "Select a project folder."
	selectFolder: true
	Component.onCompleted: folder = settings.lastFolderURL;
	onAccepted: {
	    var validProject = fileio.fileExists(folder + "/immutable_game.db");
	    console.log("isvalid?", validProject);
            settings.lastFolderString = folder;
            settings.lastFolderURL = folder;
	}
    }
    
    MenuItem {
	action: Action {
	    id: loadProjectAction
	    text: "Load Project..."
	    icon.name: "folder-open-outline"
	    icon.source: "../../icons/folder-open-outline.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+O"
	    onTriggered: openProject.open()
	}
	text: "Ctrl+N"

	contentItem: Menuitem {}
    }
}
