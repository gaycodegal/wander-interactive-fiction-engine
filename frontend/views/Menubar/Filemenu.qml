import QtQuick 2.0
import QtQuick.Controls 2.12
import QtQuick.Controls.Material 2.12
import QtQuick.Dialogs 1.2
import Qt.labs.settings 1.0

Menu {
    id: fileMenu
    title: "File"
    width: 300

    Settings {
	id: settings
	property string lastFolderString;
	property url lastFolderURL;
	property string recentFiles;
	property string recentProjects;
    }

    function updateRecentFiles() {
	console.log('updating files');
    }

    function updateRecentProjects(filePath) {
	var projects = JSON.parse(settings.recentProjects || '[]');
	var projectIndex = projects.map(function(project) {return project.filePath; }).indexOf(filePath);
	if (projectIndex >= 0) {
	    projects.splice(projectIndex, 1);
	} 
	projects = [{ filePath: filePath, project: filePath.split('/').splice(-1)[0] }].concat(projects);
	if (projects.length > 5) {
	    projects.pop();
	}
	settings.recentProjects = JSON.stringify(projects);
    }

    FileDialog {
	id: newProject
	width: 100
	height: 100
	title: "Select a project folder."
	selectFolder: true
	selectMultiple: false
	Component.onCompleted: folder = settings.lastFolderURL;
	onAccepted: {
	    var filePath = newProject.fileUrl.toString().split('//')[1];
            settings.lastFolderString = folder;
            settings.lastFolderURL = folder;
	    var success = fileio.newFile(filePath + "/immutable_game.db", "");
	    
	    if (success) {
		updateRecentProjects(filePath);
		
		console.log('load new game assets');
	    }
	}
    }

    MenuItem {
	action: Action {
	    id: newProjectAction
	    text: "New Project"
	    icon.name: "folder-plus-outline"
	    icon.source: "../../icons/folder-plus-outline.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+N"
	    onTriggered: newProject.open()
	}
	text: "Ctrl+N"

	contentItem: Menuitem {}
    }

    FileDialog {
	id: openProject
	title: "Select a project folder."
	selectFolder: true
	selectMultiple: false
	Component.onCompleted: folder = settings.lastFolderURL;
	onAccepted: {
	    var filePath = openProject.fileUrl.toString().split('//')[1];
	    var validProject = fileio.fileExists(filePath + "/immutable_game.db");
            settings.lastFolderString = folder;
            settings.lastFolderURL = folder;
	    var projects = JSON.parse(settings.recentProjects || '[]');
	    
	    if (validProject) {
		updateRecentProjects(filePath);
		
		console.log('load game assets');
	    }
	}
    }
    
    MenuItem {
	action: Action {
	    id: loadProjectAction
	    text: "Load Project..."
	    icon.name: "folder-open-outline"
	    icon.source: "../../icons/folder-open-outline.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+O"
	    onTriggered: {
		openProject.open();
	    }
	}
	text: "Ctrl+O"

	contentItem: Menuitem {}
    }

    Menu {
	cascade: true
	title: "Recent Files"
	MenuItem { text: "file1" }
	MenuItem { text: "file2" }
	MenuItem { text: "file3" }
    }

    Menu {
	id: recentProjectsMenu
	cascade: true
	title: "Recent Projects"
	
	onOpenedChanged: {
	    //settings.recentProjects = '[]';
	    while (recentProjectsMenu.takeItem(0)) {
		recentProjectsMenu.removeItem(0);
	    }
	    
	    var projects = JSON.parse(settings.recentProjects || '[]');
	    for (var index in projects) {
		var item = Qt.createQmlObject(`import QtQuick 2.13; import QtQuick.Controls 2.13; MenuItem {onTriggered: { var fp = '${projects[index].filePath}'; console.log('loading ', fp, ' asssets'); updateRecentProjects(fp); } }`, recentProjectsMenu);
		item.text = `${~~index+1}: ${projects[index].project}`;
		recentProjectsMenu.addItem(item);
	    };
	}
    }
    
    MenuSeparator {}

    MenuItem {
	action: Action {
	    id: saveFileAction
	    text: "Save File"
	    icon.name: "content-save"
	    icon.source: "../../icons/content-save.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+S"
	    onTriggered: {
		console.log("saving file");
	    }
	}
	text: "Ctrl+S"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    id: saveAllFilesAction
	    text: "Save All"
	    icon.name: "content-save-all"
	    icon.source: "../../icons/content-save-all.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+S"
	    onTriggered: {
		console.log("saving all files");
	    }
	}
	text: "Ctrl+Shift+S"

	contentItem: Menuitem {}
    }
    
    MenuSeparator {}

    MenuItem {
	action: Action {
	    id: closeFileAction
	    text: "Close File"
	    icon.name: "close-box"
	    icon.source: "../../icons/close-box.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+W"
	    onTriggered: {
		console.log("closing file");
	    }
	}
	text: "Ctrl+W"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    id: closeAllFilesAction
	    text: "Close All"
	    icon.name: "close-box-multiple"
	    icon.source: "../../icons/close-box-multiple.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Shift+W"
	    onTriggered: {
		console.log("closing all file");
	    }
	}
	text: "Ctrl+Shift+W"

	contentItem: Menuitem {}
    }

    MenuItem {
	action: Action {
	    id: closeProjectAction
	    text: "Close Project"
	    icon.name: "close-outline"
	    icon.source: "../../icons/close-outline.png"
	    icon.color: Material.iconColor
	    onTriggered: {
		console.log("closing project");
	    }
	}
	text: ''

	contentItem: Menuitem {}
    }

    MenuSeparator {}

    MenuItem {
	action: Action {
	    id: exitAction
	    text: "Exit"
	    icon.name: "exit-run"
	    icon.source: "../../icons/exit-run.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Q"
	    onTriggered: Qt.quit()
	}
	text: "Ctrl+Q"

	contentItem: Menuitem {}
    }
}
