const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

// What the preview panel can show inline: everything else is a file to download.
export const getSmbDocumentPreviewKind = (
  fileName: string,
): 'IMAGE' | 'PDF' | 'OTHER' => {
  const extension = fileName.includes('.')
    ? fileName.split('.').at(-1)?.toLowerCase()
    : undefined;

  if (extension === 'pdf') {
    return 'PDF';
  }

  return extension !== undefined && IMAGE_EXTENSIONS.includes(extension)
    ? 'IMAGE'
    : 'OTHER';
};
