import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12

Menu {
    id: helpMenu
    title: "Help"
    width: 300

      MenuItem {
	action: Action {
	    text: "About"
	    // icon.source: "../../icons/hammer.png"
	    icon.color: Material.iconColor
	    // shortcut: "F11"
	    onTriggered: {
		console.log('help description')
	    }
	}
	text: ""

	contentItem: Menuitem {}
    }
}
