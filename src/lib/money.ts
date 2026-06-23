// Orim deals only in Jordanian Dinar (JOD). The JOD has THREE decimal places,
// so every monetary amount in this codebase is stored as an integer number of
// "fils" (1 JOD = 1000 fils). Integer minor units keep all cart / order /
// ledger arithmetic exact (no floating-point drift) and map cleanly onto a
// future Supabase `integer` column. Display ALWAYS goes through formatJOD().

export type Fils = number

const jodFormatter = new Intl.NumberFormat('en-JO', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

/** Author a JOD amount as fils, e.g. `jod(12.5)` -> `12500`. */
export function jod(amount: number): Fils {
  return Math.round(amount * 1000)
}

/** Format fils as a JOD string with 3 decimals, e.g. `12500` -> `"12.500 JD"`. */
export function formatJOD(amount: Fils): string {
  return `${jodFormatter.format(amount / 1000)} JD`
}
