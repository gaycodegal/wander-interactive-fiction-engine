import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12

MenuBar {
    id: menuBar

    Filemenu {}

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
