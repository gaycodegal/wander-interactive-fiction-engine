const rootpath = 'wife/';
function RootResolver () {
    return {
	name: 'root-resolver',
	resolveId ( source ) {
	    if (source.startsWith(rootpath)) {
		let newroot = 'bazel-out/k8-fastbuild/bin/';
		const location = newroot + source.substring(rootpath.length) + ".mjs";
		return location;
	    }
	    return null; // other ids should be handled as usually
	},
    };
}

export default ({
    output: {
    },
    plugins: [RootResolver()],
});
