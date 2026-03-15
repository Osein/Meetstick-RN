fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### test_ipa_to_firebase

```sh
[bundle exec] fastlane test_ipa_to_firebase
```

Build TEST IPA (com.meetstick.app.beta) and upload to Firebase App Distribution

### prod_ipa_to_firebase

```sh
[bundle exec] fastlane prod_ipa_to_firebase
```

Build PROD IPA (com.meetstick.app) and upload to Firebase App Distribution

### upload_latest_test_ipa

```sh
[bundle exec] fastlane upload_latest_test_ipa
```

Upload latest IPA in dist/ to Firebase TEST app

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
