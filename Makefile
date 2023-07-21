.PHONY: all
all:
	mkdir build
	bin/packer

.PHONY: clean
clean:
	rm -rf build

.PHONY: watch
watch:
	bin/watcher bin/packer src
