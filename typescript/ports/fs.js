class FileSystem {
    constructor() {
	this.filesystem = new Promise((success, reject) => window.webkitRequestFileSystem(Window.TEMPORARY, 5 * (2 ** 20) /* 5MB */, success, reject));
    }

    async readFile(path, options = {}, callback = null) {
	try {
	    let encoding = options.encoding;
	    const fileEntry = await this.fileEntry(path, options);
	    const file = await new Promise((s,r) => fileEntry.file(s, r));
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
		    reader.readAsText(file, encoding);
		} else {
		    reader.readAsArrayBuffer(file);
		}
	    });
	    if (callback) {
		callback(null, data);
	    }
	} catch(e) {
	    if (callback) {
		callback(e, undefined);
	    }
	}

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
    let writer = await filesystem.fileWriter("test.txt", 'w');
    let result = await writer.write(new Blob(["hello friend"], {type:"text/plain"}));
    filesystem.readFile('test.txt', {flag:'r', encoding: 'utf-8'}, (err, data)=>{
	console.log(err, data);
    });
}
main();
