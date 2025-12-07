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

