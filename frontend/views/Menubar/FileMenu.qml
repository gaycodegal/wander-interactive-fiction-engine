import QtQuick 2.9
import QtQuick.Controls 2.5
import QtQuick.Controls.Material 2.3
import QtQuick.Dialogs 1.2
import QtQuick.Layouts 1.3

Menu {
    id: fileMenu
    title: "File"
    width: 300
    
    function updateRecentFiles() {
	console.log('updating files');
    }

    function updateRecentProjects(filePath) {
	var projects = JSON.parse(settings.recentProjects || '[]');
	var projectIndex = projects.map(function(project) {return project.filePath; }).indexOf(filePath);
	if (projectIndex >= 0) {
	    projects.splice(projectIndex, 1);
	}
	var project = filePath.split('/').splice(-1)[0];
	settings.openProject = project;
	projects = [{ filePath: filePath, project: project }].concat(projects);
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
	// Component.onCompleted: folder = settings.lastFolderURL;
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
	    text: "New Project"
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
	// Component.onCompleted: folder = settings.lastFolderURL;
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
	    text: "Load Project..."
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
	id: recentFilesMenu
	cascade: true
	title: "Recent Files"
	
	MenuItem { text: "File 1" }
	MenuItem { text: "File 2" }
	MenuItem { text: "File 3" }
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
	    }
	}
    }
    
    MenuSeparator {}

    MenuItem {
	action: Action {
	    text: "Save File"
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
	    text: "Save All"
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
	    text: "Close File"
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
	    text: "Close All"
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
	    text: "Close Project"
	    icon.source: "../../icons/close-outline.png"
	    icon.color: Material.iconColor
	    onTriggered: {
		console.log("closing project");
		settings.openProject = '';
	    }
	}
	text: ''

	contentItem: Menuitem {}
    }

    MenuSeparator {}

    MenuItem {
	action: Action {
	    text: "Exit"
	    icon.source: "../../icons/exit-run.png"
	    icon.color: Material.iconColor
	    shortcut: "Ctrl+Q"
	    onTriggered: Qt.quit()
	}
	text: "Ctrl+Q"

	contentItem: Menuitem {}
    }
}
