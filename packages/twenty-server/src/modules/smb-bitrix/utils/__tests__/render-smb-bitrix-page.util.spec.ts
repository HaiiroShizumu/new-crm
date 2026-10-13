import { renderSmbBitrixPage } from 'src/modules/smb-bitrix/utils/render-smb-bitrix-page.util';

describe('renderSmbBitrixPage', () => {
  it('escapes the title and the message', () => {
    const html = renderSmbBitrixPage({
      title: '<script>alert(1)</script>',
      message: '"quoted" & \'single\'',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&quot;quoted&quot; &amp; &#39;single&#39;');
  });

  it('finishes the installation only when asked', () => {
    expect(renderSmbBitrixPage({ title: 'a', message: 'b' })).not.toContain(
      'installFinish',
    );
    expect(
      renderSmbBitrixPage({
        title: 'a',
        message: 'b',
        shouldFinishInstall: true,
      }),
    ).toContain('BX24.installFinish()');
  });
});
