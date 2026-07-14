if (window.location.protocol === "file:") {
  document.body.innerHTML =
    '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:Georgia,serif;background:#fefaf3;color:#17352b;text-align:center">' +
    '<div style="max-width:560px"><h1 style="margin:0 0 12px;font-size:26px">Mon Coran doit etre lance avec Vite</h1>' +
    '<p style="margin:0 0 18px;line-height:1.6;color:#52635b">Cette application React ne peut pas s ouvrir directement depuis index.html. Lance le serveur local puis ouvre l URL localhost.</p>' +
    '<code style="display:inline-block;padding:10px 14px;border-radius:8px;background:#e9efe9;color:#0f3d2e">npm run dev</code></div></main>';
}
