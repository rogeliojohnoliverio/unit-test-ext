import * as vscode from 'vscode';
import * as openai from 'openai';
import * as fs from 'fs';
import path = require('path');

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _openai = new openai.OpenAIApi(
    new openai.Configuration({
      apiKey: '',
    })
  );
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Listen for messages from the Sidebar component and execute action
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'updateHighlightedText': {
          if (data.value) {
            let editor = vscode.window.activeTextEditor;
            if (editor === undefined) {
              vscode.window.showErrorMessage('No active text editor');
              return;
            }

            let text = editor.document.getText(editor.selection);
            this._view?.webview.postMessage({
              type: 'onSelectedText',
              value: text,
            });
          }
          break;
        }
        case 'getQuery': {
          if (data.value) {
            console.log(data.value);
            this._openai
              .createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'hello chatgpt' }],
              })
              .then((res) => {
                this._view?.webview.postMessage({
                  type: 'onChatGPTResponse',
                  value: res.data.choices[0].message?.content,
                });
              })
              .catch((err) => console.log(err));
          }
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const htmlContent = fs.readFileSync(
      path.resolve(this._extensionUri.fsPath, 'media', 'sidebar.html'),
      'utf8'
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
			</head>
      <body>
      ${htmlContent}
        <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
