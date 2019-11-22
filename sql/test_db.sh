#!/bin/bash

touch test.db
sqlite3 test.db <<EOF
.read ./sql/down.sql
.read ./sql/up.sql
EOF
