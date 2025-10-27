import { browser, expect } from '@wdio/globals';
import { Workbench } from 'wdio-vscode-service';

describe('LFS VSCE Side Bar Smoke Tests', () => {
  let workbench: Workbench;

  beforeEach(async () => {
    workbench = await browser.getWorkbench();
  });

  it('Extension is accessible in the Side Bar', async () => {
    // Verify if Lightning Flow Scanner is in the side bar
    const viewControls = await workbench.getActivityBar().getViewControls();
    expect(
      await Promise.all(viewControls.map((vc) => vc.getTitle()))
    ).toContain('Lightning Flow Scanner');

    // Verify if Lightning Flow Scanner can be opened in the side bar
    const lfsViewContainer = await workbench
      .getActivityBar()
      .getViewControl('Lightning Flow Scanner');
    await lfsViewContainer?.wait();
    await lfsViewContainer?.openView();
    const selectedView = await workbench
      .getActivityBar()
      .getSelectedViewAction();
    expect(await selectedView.getTitle()).toBe('Lightning Flow Scanner');

    // // TODO Verify some content of the Lightning Flow Scanner side bar
    /*  
   const openViewContainer = workbench.getSideBar();
    const openViewContainerElem = await openViewContainer.elem;
    const welcomeViewElem = await openViewContainerElem.$$(
        'a[href="https://github.com/Lightning-Flow-Scanner/lightning-flow-scanner-vsce"]'
    );
    expect(welcomeViewElem).toHaveLength(1); 
    */
  });

  it('The Get Rules command results in opening the Flow Rules view', async () => {
    // Run the View Default Flow Rules via the Command Prompt
    const commandInput = await workbench.openCommandPrompt();
    await workbench.executeCommand('flowscanner.viewDefaultFlowRules');
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    console.log('title = ', title);
    expect(title).toBe('Flow Rules');
  });
});
