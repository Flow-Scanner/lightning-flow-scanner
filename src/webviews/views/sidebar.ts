// import {
//   computed,
//   createSingletonComposable,
//   ref,
//   useLogger,
//   useWebviewView,
// } from 'reactive-vscode';

// export const useSidebarView = createSingletonComposable(() => {
//   const message = ref('');
//   const html = computed(
//     () => `
//   <script setup lang="ts">
//     const vscode = acquireVsCodeApi()
//     function updateMessage() {
//       vscode.postMessage({
//         type: 'updateMessage',
//         message: document.querySelector('input').value,
//       })
//     }
//   </script>
//   <title>Lightning Flow Scanner (Beta)</title>
//   <p>${message.value}</p>
//   <div style="display:flex; flex-wrap:wrap;">
//     <input type="text" placeholder="Input Message" />
//     <button onclick="updateMessage()">Update Message</button>
//   </div>
//   `
//   );

//   const logger = useLogger('Lightning Flow Scanner');
//   logger.info('Initializing Webview');

//   const { postMessage } = useWebviewView('lfs-sb', html, {
//     webviewOptions: {
//       enableScripts: true,
//       enableCommandUris: true,
//     },
//     onDidReceiveMessage(ev) {
//       if (ev.type === 'updateMessage') message.value = ev.message;
//     },
//   });

//   return { message, postMessage };
// });
