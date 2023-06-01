import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'unit-test-automation-tool.runUnitTest',
    () => {
      const sidebarProvider = new SidebarProvider(context.extensionUri);
      vscode.window.showInformationMessage('hello world');
      vscode.window.registerWebviewViewProvider(
        'unit-test-automation-tool',
        sidebarProvider
      );
      vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.kind !== vscode.TextEditorSelectionChangeKind.Mouse) {
          return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
          return;
        }
        // Get the highlighted text
        const highlightedText = editor.document.getText(selection);
        sidebarProvider._view?.webview.postMessage({
          type: 'onSelectedText',
          value: highlightedText,
        });
      });
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
