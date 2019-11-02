import QtQuick 2.0
import QtQuick.Controls 2.12

MenuBar {
    id: menuBar

    FileMenu {}
    NewMenu {}
    EditMenu {}
    BuildMenu {}
    WindowMenu {}
    ToolsMenu {}
    HelpMenu {}
    
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
