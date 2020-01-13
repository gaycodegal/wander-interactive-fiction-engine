const rootpath = 'wife/';
const newroot = 'bazel-out/k8-fastbuild/bin/';
function RootResolver() {
    return {
        name: 'root-resolver',
        resolveId(source) {
            if (source.startsWith(rootpath)) {
                return newroot + source.substring(rootpath.length) + '.mjs';
            }
            return null; // other ids should be handled as usually
        },
    };
}

export default {
    output: {},
    plugins: [RootResolver()],
};
