// Helper function to determine message type
export default function getMessageType(text, files) {
  const hasText = text.trim().length > 0;
  const hasImages = Array.isArray(files) && files.length > 0;
  if (hasText && hasImages) return "text_image";
  if (hasImages) return "image";
  return "text";
}
