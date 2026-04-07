export function getFlowFontClass(fontSize) {
  const size = Number(fontSize);
  if (!Number.isFinite(size)) return "text-[40px]";
  if (size <= 34) return "text-[34px]";
  if (size <= 38) return "text-[38px]";
  if (size <= 42) return "text-[42px]";
  if (size <= 46) return "text-[46px]";
  if (size <= 50) return "text-[50px]";
  if (size <= 56) return "text-[56px]";
  return "text-[62px]";
}

export function getFlowClassName(fontSize, riwaya, isQCF4) {
  const riwayaClass =
    riwaya === "hafs"
      ? " leading-[calc(var(--arabic-reading-line-height,2.46)+0.36)] [word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.024em)] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.27)]"
      : riwaya === "warsh"
        ? " leading-[calc(var(--arabic-reading-line-height,2.46)+0.28)] [word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.012em)] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.2)] max-[420px]:[word-spacing:calc(var(--arabic-reading-word-spacing-mobile,0.052em)+0.004em)]"
        : " leading-[calc(var(--arabic-reading-line-height,2.46)+0.34)] [word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.02em)] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.24)]";

  return `cpv-flow${isQCF4 ? " qcf4-container" : ""} ${getFlowFontClass(fontSize)} relative z-10 rounded-2xl border border-white/12 bg-[rgba(8,15,30,0.56)] p-5 text-center text-[var(--text-quran)] [direction:rtl] [font-family:var(--font-quran)] [font-feature-settings:"liga"_1,"calt"_1,"kern"_1,"mark"_1,"ccmp"_1] [letter-spacing:0.01em] [text-align-last:center] [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased] max-[768px]:text-[1.6rem] max-[768px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.44)] max-[480px]:text-[1.4rem] max-[480px]:text-right max-[480px]:[text-align-last:right] max-[480px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.28)] max-[360px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.18)] ${riwayaClass}`;
}

export function buildFlowItems(ayahs) {
  const items = [];
  let lastPage = null;

  ayahs.forEach((ayah) => {
    const page = ayah.page || 1;
    if (lastPage !== null && page !== lastPage) items.push({ type: "sep", pageNum: page });
    items.push({ type: "ayah", data: ayah });
    lastPage = page;
  });

  return items;
}
