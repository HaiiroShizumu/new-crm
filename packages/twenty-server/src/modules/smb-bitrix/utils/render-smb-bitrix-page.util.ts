const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type RenderSmbBitrixPageArgs = {
  title: string;
  message: string;
  // The install page must tell the portal that the installation is over,
  // otherwise Bitrix24 keeps reopening it and hides the app from employees.
  shouldFinishInstall?: boolean;
};

export const renderSmbBitrixPage = ({
  title,
  message,
  shouldFinishInstall = false,
}: RenderSmbBitrixPageArgs): string => {
  const installScript = shouldFinishInstall
    ? '<script src="https://api.bitrix24.com/api/v1/"></script><script>BX24.init(function(){BX24.installFinish();});</script>'
    : '';

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f7f7f8;color:#1f1f23}
main{max-width:420px;padding:32px;text-align:center}
h1{font-size:18px;font-weight:600;margin:0 0 8px}
p{font-size:14px;line-height:1.5;color:#5f5f66;margin:0}
</style>
</head>
<body>
<main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main>
${installScript}
</body>
</html>`;
};
