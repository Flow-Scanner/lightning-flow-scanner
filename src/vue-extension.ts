// import { defineExtension, useLogger } from 'reactive-vscode';
// import { window } from 'vscode';
// import { useSidebarView } from './webviews/views/sidebar';

// export function initialize() {
//   const logger = useLogger('Lightning Flow Scanner');
//   logger.info('Extension Activated');

//   window.showInformationMessage(
//     'Lightning Flow Scanner Beta, this is an effort to use Vue 3 and update all package dependencies to latest versions.'
//   );

//   useSidebarView();

//   // const isDark = useIsDarkTheme();
//   // watchEffect(() => {
//   //   logger.info('Is Dark Theme:', isDark.value);
//   // });

//   logger.show();
// }

// const { activate } = defineExtension(() => {
//   initialize();
// });

// export { activate };
