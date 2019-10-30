import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12
import QtQuick.Dialogs 1.2

Menu {
    id: fileMenu
    title: "File"
    
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
		console.log("New Project.", fileio.isDir("/home/gluax/docs"));
	    }
	}
	text: "Ctrl+N"

	contentItem: Menuitem {}
    }

    FileDialog {
	id: openProject
	title: "Select a project folder."
	onAccepted: {
	    console.log("opened folder.");
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
