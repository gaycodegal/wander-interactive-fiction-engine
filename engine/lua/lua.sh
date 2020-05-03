RUNFILES=${BASH_SOURCE[0]}.runfiles
cd "$BUILD_WORKING_DIRECTORY"
$RUNFILES/wife/engine/lua/lua-main $@
