# .well-known

Esta pasta hospeda o arquivo `assetlinks.json` exigido pelo Android quando
o APK gerado pelo PWABuilder é uma Trusted Web Activity (TWA).

Sem esse arquivo, o APK funciona, mas mostra uma pequena barra do Chrome
no topo. Com ele, o app abre em tela cheia, como um app nativo.

## Como obter

1. Faça o deploy do app no Netlify (ou qualquer host HTTPS público).
2. Gere o APK em https://pwabuilder.com → Package for Stores → Android.
3. O ZIP baixado contém `assetlinks.json` na raiz.
4. Copie esse `assetlinks.json` para `public/.well-known/assetlinks.json`.
5. Faça `npm run build` e redeploye.

Após o segundo deploy, ao abrir o APK no celular a barra do Chrome some.
