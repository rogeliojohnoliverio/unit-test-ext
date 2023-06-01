import * as _vscode from 'vscode';

declare global {
  const tsvscode: {
    postMessage: ({ type, value }: { type: string; value: any }) => void;
  };
  const SE: {
    init: (options: Object) => void;
    authenticate: (options: Object) => void;
  };
}
