import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12

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


    Action { text: "New Project" }
    Action { text: "Load Project..." }
}
