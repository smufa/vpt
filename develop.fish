#!/bin/env fish

make clean; make all; bin/server-node &;
while true; inotifywait -e modify,create,delete -r . && kill %1; make clean; make all; bin/server-node &; end
