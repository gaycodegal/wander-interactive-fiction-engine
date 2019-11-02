import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12

Menu {
    id: newMenu
    title: "New"
    width: 300

    MenuItem {
	action: Action {
	    text: "New Character"
	    icon.source: "../../icons/account-plus.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+C"
	    onTriggered: console.log('loading new character template.')
	}
	text: "Ctrl+Shift+C"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "New Dialogue"
	    icon.source: "../../icons/chat.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+D"
	    onTriggered: console.log('loading new dialogue template.')
	}
	text: "Ctrl+Shift+D"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "New Event"
	    icon.source: "../../icons/calendar-alert.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+E"
	    onTriggered: console.log('loading new Event template.')
	}
	text: "Ctrl+Shift+E"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "New Item"
	    icon.source: "../../icons/cube-outline.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+I"
	    onTriggered: console.log('loading new Item template.')
	}
	text: "Ctrl+Shift+I"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "New Location"
	    icon.source: "../../icons/map-marker.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+L"
	    onTriggered: console.log('loading new Location template.')
	}
	text: "Ctrl+Shift+L"

	contentItem: Menuitem {}
    }
}
