let interFonts;

async function loadFont(filename) {
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/${filename}`);
  if (!response.ok) throw new Error('Could not load Inter for PDF export. Please retry.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return btoa(binary);
}

export async function registerPdfInter(pdf) {
  if (!interFonts) {
    interFonts = Promise.all([loadFont('Inter-Regular.ttf'), loadFont('Inter-Bold.ttf')])
      .catch(error => { interFonts = undefined; throw error; });
  }
  const [regular, bold] = await interFonts;
  pdf.addFileToVFS('Inter-Regular.ttf', regular);
  pdf.addFont('Inter-Regular.ttf', 'Inter', 'normal');
  pdf.addFileToVFS('Inter-Bold.ttf', bold);
  pdf.addFont('Inter-Bold.ttf', 'Inter', 'bold');
  pdf.setFont('Inter', 'normal');
}
