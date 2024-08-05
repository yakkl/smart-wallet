# Extension specifics

As of version 0.30.5-beta, we support multiple browser.
- Chrome
- Brave
- Firefox
- Edge
- *Opera
- *Safari (not fully committed)

There is a subdirectory for each browser under this base directory called 'lib/extensions'. Webpack will merge and modify files in each sub-directory for the specific browser and then copy them to this base directory. We should remove any scratch files, but we will do that later.

There may be a better way where we only manipulate the manifest files and then inject specific browser related code (if any)!!

## Extensions Directory

This directory serves two purposes. It holds the sub-directories for the different browsers and it acts a temporary working build directory. **ALL** code changes must be done in the correct sub-directory. Once the build process starts, it will copy the code and manifest template to the root working build directory. This directory will be used to build out for webpack.
