.PHONY: build publish publish-patch publish-minor publish-major

build:
	npm run build

publish-patch: build
	npm version patch
	npm publish
	git push --follow-tags

publish-minor: build
	npm version minor
	npm publish
	git push --follow-tags

publish-major: build
	npm version major
	npm publish
	git push --follow-tags

publish: publish-patch
