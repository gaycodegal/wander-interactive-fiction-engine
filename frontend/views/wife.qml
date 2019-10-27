import QtQuick 2.12
import QtQuick.Window 2.13
import QtQuick.Controls 2.12
import QtQuick.Layouts 1.3
import QtQuick.Controls.Material 2.12

ApplicationWindow {
    id: window
    visible: true
    width: 140
    height: 480
    title: "WIFE IFT Game Builder"
    Material.theme: Material.Dark

    Action {
        id: copyAction
        text: "Copy"
        shortcut: StandardKey.Copy
        icon.name: "edit-copy"
        icon.color: Material.iconColor
        enabled: (!!activeFocusItem && !!activeFocusItem["copy"])
        onTriggered: activeFocusItem.copy()
    }
    Action {
        id: cutAction
        text: "Cut"
        shortcut: StandardKey.Cut
        icon.name: "edit-cut"
        icon.color: Material.iconColor
        enabled: (!!activeFocusItem && !!activeFocusItem["cut"])
        onTriggered: activeFocusItem.cut()
    }
    Action {
        id: pastAction
        text: "Paste"
        shortcut: StandardKey.Paste
        icon.name: "edit-paste"
        icon.color: Material.iconColor
        enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
        onTriggered: activeFocusItem.paste()
    } 
    Action {
        id: quitAction
        text: "Exit"
        icon.color: Material.iconColor
        shortcut: StandardKey.Quit
        onTriggered: Qt.quit()
    }
    Action {
        id: redoAction
        text: "Redo"
        shortcut: StandardKey.Redo
        icon.name: "edit-paste"
        icon.color: Material.iconColor
        enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
        onTriggered: activeFocusItem.paste()
    }
    Action {
        id: undoAction
        text: "Undo"
        shortcut: StandardKey.Undo
        icon.name: "edit-paste"
        enabled: (!!activeFocusItem && !!activeFocusItem["paste"])
        onTriggered: activeFocusItem.paste()
    }

    menuBar: MenuBar {
        id: menuBar

        Menu {
            id: fileMenu
            title: "File"
            MenuItem {
                action: quitAction
                text: "Ctrl+Q"

                contentItem: RowLayout {
                    Text {
                        text: parent.parent.action.text
                        color: Material.primaryTextColor
                        opacity: enabled ? 1.0 : 0.3
                        Layout.alignment: Qt.AlignLeft
                        verticalAlignment: Text.AlignVCenter
                    }

                    Text {
                        text: parent.parent.text
                        color: Material.primaryTextColor
                        opacity: enabled ? 1.0 : 0.3
                        Layout.alignment: Qt.AlignRight
                        verticalAlignment: Text.AlignVCenter
                    }


                }
            }


            Action { text: "New Project" }
            Action { text: "Load Project..." }
        }

        Menu {
            id: newMenu
            title: "New"
            Action { text: "Character" }
            Action { text: "Dialogue" }
            Action { text: "Event" }
            Action { text: "Item" }
            Action { text: "Location" }
        }

        Menu {
            id: editMenu
            title: "Edit"
            MenuItem { action: undoAction }
            MenuItem { action: redoAction }
            MenuSeparator {}
            MenuItem { action: copyAction }
            MenuItem { action: cutAction }
            MenuItem { action: pastAction }
        }

        Menu {
            id: buildMenu
            title: "Build"
        }

        Menu {
            id: viewMenu
            title: "view"
        }

        /*
        delegate: MenuBarItem {
            id: menuBarItem

            contentItem: Text {
                text: menuBarItem.text
                font: menuBarItem.font
                opacity: enabled ? 1.0 : 0.3
                color: menuBarItem.highlighted ? "#ffffff" : "#21be2b"
                horizontalAlignment: Text.AlignLeft
                verticalAlignment: Text.AlignVCenter
                elide: Text.ElideRight
            }

            background: Rectangle {
                implicitWidth: 40
                implicitHeight: 40
                opacity: enabled ? 1 : 0.3
                color: menuBarItem.highlighted ? "#21be2b" : "transparent"
            }
        }

        background: Rectangle {
            implicitWidth: 40
            implicitHeight: 40
            color: "#551A8B"

            Rectangle {
                color: "#21be2b"
                width: parent.width
                height: 1
                anchors.bottom: parent.bottom
            }
        }
        */
    }

    MouseArea {
        anchors.fill: parent
        onClicked: {
            window.width = 500
            window.height = 500
            window.update()
        }
    }


    Rectangle {
        id: character_editor
        visible: false
        focus: false
        y: menuBar.height + 20

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
        y: menuBar.height + 20

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
