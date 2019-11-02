import QtQuick 2.9
import QtQuick.Controls 2.5
import QtQuick.Layouts 1.3

Rectangle {
    property string folder_name
    property bool enabled: settings.openProject !== ""
    property bool open: false
    property string arrow: "../../icons/menu-right.png"
    property string arrow_right: "../../icons/menu-right.png"
    property string arrow_down: "../../icons/menu-down.png"
    property string folder: "../../icons/folder.png"
    property string folder_closed: "../../icons/folder.png"
    property string folder_open: "../../icons/folder-open-outline.png"
    
    width: 150
    height: 25
    color: "red"

    MouseArea {
	anchors.fill: parent
	onEntered: {
	    if (!parent.enabled) return;
	    open = !open;
	    arrow = (open ? arrow_down : arrow_right);
	    folder = (open ? folder_open : folder_closed);
	}
    }
    
    
    RowLayout {
	Image {
	    sourceSize.height: 32
            sourceSize.width: 32
	    source: arrow
	}
	
	Image {
	    sourceSize.height: 16
            sourceSize.width: 16
	    source: folder
	}

	Text {
	    text: folder_name
	    color: enabled ? "white" : "black"
	}
    }


    
}
