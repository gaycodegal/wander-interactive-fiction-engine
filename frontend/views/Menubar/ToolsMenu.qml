import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12

Menu {
    id: toolsMenu
    title: "Tools"
    width: 300

    MenuItem {
	action: Action {
	    text: "Find"
	    // icon.source: "../../icons/hammer.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+F"
	    onTriggered: {
		console.log('find me')
	    }
	}
	text: "Ctrl+F"

	contentItem: Menuitem {}
    }
}
