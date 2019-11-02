import QtQuick 2.0
import QtQuick.Window 2.13
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12
import QtQuick.Layouts 1.3

Menu {
    id: editMenu
    title: "Edit"
    width: 300

    MenuItem {
	action: Action {
	    text: "Undo"
	    icon.name: "undo"
	    icon.source: "../../icons/undo.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Z"
	    enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
	    onTriggered: activeFocusItem.paste()
	}
	text: "Ctrl+Z"

	contentItem: Menuitem {}
    }
    
    MenuItem {
	action: Action {
	    text: "Redo"
	    icon.name: "redo"
	    icon.source: "../../icons/redo.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+Z"
	    enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
	    onTriggered: activeFocusItem.paste()
	}
	text: "Ctrl+Shift+Z"

	contentItem: Menuitem {}
    }
    
    MenuSeparator {}

    MenuItem {
	action: Action {
	    text: "Cut"
	    icon.name: "content-cut"
	    icon.source: "../../icons/content-cut.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+X"
	    enabled: (!!activeFocusItem && !!activeFocusItem["cut"])
	    onTriggered: activeFocusItem.cut()
	}
	text: "Ctrl+X"

	contentItem: Menuitem {}
    }
    
    MenuItem {
	action: Action {
	    text: "Copy"
	    icon.name: "content-copy"
	    icon.source: "../../icons/content-copy.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+C"
	    enabled: (!!activeFocusItem && !!activeFocusItem["copy"])
	    onTriggered: activeFocusItem.copy()
	}
	text: "Ctrl+C"

	contentItem: Menuitem {}
    }
    
    MenuItem {
	action: Action {
	    text: "Paste"
	    icon.name: "content-paste"
	    icon.source: "../../icons/content-paste.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+V"
	    enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
	    onTriggered: activeFocusItem.paste()
	}
	text: "Ctrl+V"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "Delete"
	    shortcut: "Ctrl+D"
	    enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
	    // onTriggered: activeFocusItem.
	}
	text: "Ctrl+D"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    text: "Select All"
	    shortcut: "Ctrl+A"
	    enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
	    // onTriggered: activeFocusItem.
	}
	text: "Ctrl+A"

	contentItem: Menuitem {}
    }

}
