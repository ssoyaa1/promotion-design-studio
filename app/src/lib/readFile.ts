/** Read the first file from a file input as a base64 data URL. */
export function readFile(e: React.ChangeEvent<HTMLInputElement>, cb: (dataUrl: string) => void) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => cb(r.result as string)
  r.readAsDataURL(f)
}
