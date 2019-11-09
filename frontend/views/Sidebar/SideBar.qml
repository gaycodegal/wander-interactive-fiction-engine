import QtQuick 2.9
import QtQuick.Controls 2.5
import QtQuick.Layouts 1.3

Rectangle {
    height: parent.height
    width: 200
    border.color: "green"
    border.width: 10
    
    ColumnLayout {
	visible: true
	width: 200
	height: parent.height
	spacing: 2

	Text {
	    text: settings.openProject || "No Project Open"
	}
	
	SideBarItem {
	    id: sideBarCharacters
	    folder_name: "Characters"
	}

	SideBarItem {
	    id: sideBarDialogues
    	    folder_name: "Dialogues"
	}

	SideBarItem {
	    id: sideBarEvents
    	    folder_name: "Events"
	}

	SideBarItem {
	    id: sideBarItems
    	    folder_name: "Items"
	}

	SideBarItem {
	    id: sideBarLocations
    	    folder_name: "Locations"
	}

	Item { Layout.fillHeight: true }
	
    }

}
