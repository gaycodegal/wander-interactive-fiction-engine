import QtQuick 2.9
import QtQuick.Window 2.3
import QtQuick.Controls 2.5
import QtQuick.Controls.Material 2.3

Menu {
    id: windowMenu
    title: "Window"
    width: 300

    MenuItem {
	action: Action {
	    text: "Toggle FullScreen"
	    // icon.source: "../../icons/hammer.png"
	    icon.color: Material.iconColor
	    shortcut: "F11"
	    onTriggered: {
		window.visibility =(window.windowed ? Window.FullScreen : Window.Windowed);
		window.windowed = !window.windowed;
	    }
	}
	text: "Fn+F11"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "Toggle SideBar"
	    // icon.source: "../../icons/hammer.png"
	    icon.color: Material.iconColor
	    // shortcut: "F11"
	    onTriggered: {
		sideBar.visible = !sideBar.visible;
	    }
	}
	text: ""

	contentItem: Menuitem {}
    }
}
