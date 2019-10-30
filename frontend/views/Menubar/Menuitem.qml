import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Layouts 1.3
import QtQuick.Controls.Material 2.12

RowLayout {
    RowLayout {
	Layout.alignment: Qt.AlignLeft
	
	Image {
	    sourceSize.height: 16
            sourceSize.width: 16
	    source: parent.parent.parent.action.icon.source
	}
	
	Text {
            text: parent.parent.parent.action.text
            color: Material.primaryTextColor
            opacity: enabled ? 1.0 : 0.3
	}
    }
    

    Text {
        text: parent.parent.text
        color: Material.primaryTextColor
        opacity: enabled ? 1.0 : 0.3
        Layout.alignment: Qt.AlignRight
    }
}
