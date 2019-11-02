import QtQuick 2.9
import QtQuick.Controls 2.5
import QtQuick.Controls.Material 2.3

Menu {
    id: buildMenu
    title: "Build"
    width: 300

    MenuItem {
	action: Action {
	    text: "Build Project"
	    icon.source: "../../icons/hammer.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+B"
	    onTriggered: console.log('Building...');
	}
	text: "Ctrl+B"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "Run Project"
	    icon.source: "../../icons/play.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+R"
	    onTriggered: console.log('Running...');
	}
	text: "Ctrl+R"

	contentItem: Menuitem {}
    }
}
