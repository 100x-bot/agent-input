.PHONY: build publish publish-patch publish-minor publish-major test-e2e test-e2e-headed

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

test-e2e:
	npx jest --config e2e/jest.config.cjs --runInBand

test-e2e-headed:
	HEADLESS=false npx jest --config e2e/jest.config.cjs --runInBand
