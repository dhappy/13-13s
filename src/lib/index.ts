export const invert = (color: string, base = 16) => {
  const digits = (
    Array.from({ length: base }).map((_,i) => i.toString(base))
  )
  const map = Object.fromEntries(
    digits.map((digit: string, idx: number) => (
      [digit, digits.toReversed()[idx]]
    ))
  )
  return (
    color
    .toLowerCase()
    .split('')
    .map((digit) => digit in map ? map[digit] : digit)
    .join('')
  )
}

export function download({ url, name }: { url: string, name: string }) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function luminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function contrastColor(hexColor: `#${string}`) {
  const width = hexColor.length <= 4 ? 1 : 2
  let pos = 1
  const r = parseInt(hexColor.slice(pos, pos += width), 16)
  const g = parseInt(hexColor.slice(pos, pos += width), 16)
  const b = parseInt(hexColor.slice(pos, pos += width), 16)

  return luminance(r, g, b) > 0.179 ? '#000' : '#FFF'
}
