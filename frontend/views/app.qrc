import QtQuick 2.12
import QtQuick.Window 2.12
import QtQuick.Controls 2.12
import QtQuick.Layouts 1.3
import QtQuick.Controls.Material 2.12

ApplicationWindow {
    id: window
    Material.theme: Material.Dark
    visible: true
    width: 640
    height: 480


    MouseArea {
        anchors.fill: parent
        onClicked: {
            window.width = 500
            window.height = 500
            window.update()
        }
    }

    title: qsTr("WIFE IFT Game Builder")

    ToolBar {
        id: tb
        RowLayout {
            anchors.fill: parent
            width: parent.width

            ToolButton {
                text: qsTr("<")
                onClicked: stack.pop()
            }

            ToolButton {
                text: "New"
                Layout.fillWidth: true
                onClicked: menu.open()
            }
        }
    }

    Menu {
        id: menu
        title: "New"

        MenuItem {
            text: "Character"
            onTriggered: character_editor.visible = true
        }

        MenuItem {
            text: "Dialogue"
            onTriggered: dialogue_editor.visible = true
        }

        MenuItem {
            text: "Item"
            onTriggered: item_editor.visible = true
        }

        MenuItem {
            text: "Location"
            onTriggered: location_editor.visible = true
        }
    }

    Rectangle {
        id: character_editor
        visible: false
        focus: false
        y: tb.height + 20

        TextField {
            placeholderText: qsTr("Character Name")
        }

        Button {
            text: "Save Character"
            onClicked: parent.visible = false
        }
    }

    GridLayout {
        id: location_editor
        visible: false
        y: tb.height + 20

        columns: 1
        rowSpacing: 3
        columnSpacing: 5


        Label { text: "Location Name" }
        TextField { id: location_name; Layout.fillWidth: true; }

        Label { text: "Location Description" }
        TextArea {
            id: location_description
            wrapMode: TextArea.WrapAnywhere
        }

        ToolBar {
            RowLayout {
                anchors.fill: parent
                width: parent.width
                Label { text: "Location Items" }
                ToolButton {
                    text: "+"
                    onClicked: {
                        var component = Qt.createComponent("field.qml");
                        var sprite = component.createObject(location_items, {"id": "item_1"})
                    }
                }
            }
        }

        GridLayout {
            id: location_items
            columns: 1
            rowSpacing: 3
            columnSpacing: 5

        }

        Label { text: "Location Neighbors" }
        Button {
            text: "+"
            onClicked: {
                var component = Qt.createComponent("field.qml");
                var sprite = component.createObject(location_neighbors, {"id": "item_1"})
            }
        }
        GridLayout {
            id: location_neighbors
            columns: 1
            rowSpacing: 3
            columnSpacing: 5

        }

        Label { text: "Location Characters" }
        Button {
            text: "+"
            onClicked: {
                var component = Qt.createComponent("field.qml");
                var sprite = component.createObject(location_characters, {"id": "item_1"})
            }
        }
        GridLayout {
            id: location_characters
            columns: 1
            rowSpacing: 3
            columnSpacing: 5

        }


        Button {
            y: parent.y + 15
            text: "Save Location"
            onClicked: parent.visible = false
        }
    }

    StackView {
        id: stack
        anchors.fill: parent
    }
}
