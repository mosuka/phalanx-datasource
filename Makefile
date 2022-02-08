NAMA ?= mosuka-phalanx-datasource
TAG ?=

.PHONY: build
build:
	yarn install --pure-lockfile
	yarn build

.PHONY: dist
dist:
	mv dist/ $(NAMA)
	zip $(NAMA)-$(TAG).zip $(NAMA) -r
	md5sum $(NAMA)-$(TAG).zip > $(NAMA)-$(TAG).md5
	rm -rf $(NAMA)

.PHONY: tag
tag:
ifeq ($(TAG),$(filter $(TAG),latest main ""))
	@echo "please specify TAG"
else
	git tag -a $(TAG) -m "Release $(TAG)"
	git push origin $(TAG)
endif
