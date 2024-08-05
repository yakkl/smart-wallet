# DO NOT USE

Do not use the 'goto(PATH_LOGOUT)' call because logout closes down the background service and free's all port connections. Instead, use 'window.close()', this will simply close a given popup but continue the port connection from the content.ts to the background.ts so that other commands get passed to the background.ts code where all transactions occur. 

If you use the logout call then the port connection from content.ts to background.ts is disconnected and all resources released. Content.ts will continue to work from events from inpage.ts (inside the dApp), but nothing will get to the background.ts code. The only way to enable the port connection from content.ts to background.ts is to refresh the dApp page. However, this simply starts the cycle over again with the same issues giving you the impression that it's now working as expected.


