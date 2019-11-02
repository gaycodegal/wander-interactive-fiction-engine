import QtQuick 2.0
import QtQuick.Window 2.13
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12

Menu {
    id: windowMenu
    title: "Window"
    width: 300

    MenuItem {
	action: Action {
	    text: "Full Screen"
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
}
