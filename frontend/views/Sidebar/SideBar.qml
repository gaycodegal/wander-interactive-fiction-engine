import QtQuick 2.9
import QtQuick.Controls 2.5
import QtQuick.Layouts 1.3

ColumnLayout {
    visible: true
    width: 200
    height: parent.height
    spacing: 2

    Text {
	text: settings.openProject || "No Project Open"
    }
    SideBarItem {
	folder_name: "Characters"
    }

    SideBarItem {
    	folder_name: "Dialogues"
    }

    SideBarItem {
    	folder_name: "Events"
    }

    SideBarItem {
    	folder_name: "Items"
    }

    SideBarItem {
    	folder_name: "Locations"
    }

    Item { Layout.fillHeight: true }
    
}
