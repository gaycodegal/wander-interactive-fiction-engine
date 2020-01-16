window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
navigator.persistenStorage = navigator.persistentStorage | navigator.webkitPersistentStorage
class FileSystem {
    constructor() {
	this.filesystem = new Promise((success, reject) => navigator.webkitPersistentStorage.requestQuota(5 * (2 ** 20) /* 5MB */, success, reject)).then(grantedStorage => new Promise((success, reject) => window.webkitRequestFileSystem(Window.PERMANENT, 5 * (2 ** 20) /* 5MB */, success, reject)));
    }

    async readFile(path, options = {}, callback = null) {
	try {
	    let data = null;
	    if (path instanceof URL){
		data = await this.readUrl(path, this.coerceEncoding(options.encoding));
	    } else if (typeof path == "object") {
		data = await this.readBlob(this.blobify(
		    data,
		    this.coerceEncoding(options.encoding)));
	    } else {
		data = await this.readFilesystemFile(path, options);
	    }
	    if (callback) {
		callback(null, data);
	    }
	} catch(e) {
	    if (callback) {
		callback(e, undefined);
	    }
	    throw e;
	}

    }

    mimeTypeFor(encoding) {
	return `text/plain;charset=${encoding}`;
    }

    readUrl(path, encoding) {
	return new Promise((s, r) => {
	    const request = new XMLHttpRequest();
	    request.onload = function(e) {
		if (encoding) {
		    s(request.responseText);
		} else {
		    s(request.response);
		}
	    }
	    request.onerror = r;
	    request.open("GET", path);
	    if (!encoding) {
		request.responseType = "arraybuffer";
	    } else {
		request.overrideMimeType(this.mimeTypeFor(encoding));
	    }
	    request.send();
	});
    }
    
    async readBlob(blob, encoding) {
	let data = await new Promise((success, reject) => {
	    const reader = new FileReader();
	    
	    reader.onloadend = function(e) {
		if (reader.error) {
		    reject(reader.error);
		} else {
		    success(this.result);
		}
	    };
	    
	    if (encoding) {
		reader.readAsText(blob, encoding);
	    } else {
		reader.readAsArrayBuffer(blob);
	    }
	});
	return data;
    }
	
    async readFilesystemFile(path, options) {
	let encoding = this.coerceEncoding(options.encoding);
	const fileEntry = await this.fileEntry(path, options);
	const file = await new Promise((s,r) => fileEntry.file(s, r));
	return await this.readBlob(file, encoding);
    }

    async fileEntry(path, options = {}) {
	let fs = await this.filesystem;
	let _options = {};
	let flag = options.flag || "";
	let createIfNonExtant = flag.charAt(0) == 'a';
	let failIfExtant = flag.charAt(1) == 'x';
	_options.create = flag.charAt(0) == 'w' || (failIfExtant && createIfNonExtant);
	_options.exclusive = failIfExtant;
	createIfNonExtant = createIfNonExtant && !failIfExtant;
	const fileEntry = await new Promise((s, r) => {
	    let failure = r;
	    if (createIfNonExtant) {
		failure = ()=>{
		    fs.root.getFile(path, {
			create: true,
			exclusive: false,
		    }, s, r);
		}
	    }
	    fs.root.getFile(path, _options, s, failure);
	});
	return fileEntry;
    }

    async fileWriter(path, flag) {
	const fileEntry = await this.fileEntry(path, {flag});
	const writer = await new Promise((s, r)=> {
	    fileEntry.createWriter(s, r);
	});
	return new Writer(writer);
    }

    blobify(data, encoding){
	if (data instanceof Blob) {
	    // pass
	} else if (encoding) { 
	    data = new Blob([data],{encoding, type: this.mimeTypeFor(encoding)});
	} else {
	    data = new Blob([data]);
	}
	return data;
    }

    async writeFile(path, data, options = {}, callback = null) {
	try {
	    let encoding = this.coerceEncoding(options.encoding);
	    options.flag = options.flag || 'w';
	    const fileEntry = await this.fileEntry(path, options);
	    const writer = new Writer(await new Promise((s, r)=> {
		fileEntry.createWriter(s, r)}));
	    data = this.blobify(data, encoding);
	    await writer.write(data);
	} catch (e) {
	    if (callback) {
		callback(err);
	    }
	    throw e;
	}
    }

    coerceEncoding(encoding) {
	if (encoding === undefined || encoding == 'utf8') {
	    return 'UTF-8';
	}
	return encoding
    }

}

class Writer {
    constructor(writer) {
	this.writer = writer;
    }

    renewPromise() {
	this.promise = new Promise((s, r)=>{
	    this.writer.onwriteend = s;
	    this.writer.onerror = s;
	});
    }

    async write(blob) {
	this.renewPromise();
	return await this.writer.write(blob);
    }
}

async function main() {
    filesystem = new FileSystem();
    await filesystem.writeFile('test.txt', "hello friend")
    await filesystem.readFile('test.txt', {flag:'r', encoding: 'utf-8'}, (err, data)=>{
	console.log(err, data);
    });
    await filesystem.readFile(new URL(location.toString()), {flag:'r', encoding: 'utf-8'}, (err, data)=>{
	console.log(err, data);
    });
    console.log('ok');
}
main();
