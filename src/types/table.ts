export interface TableRow {
  id: string
  label: string
  values: string[]
  total: number
  perUnit?: number
  isCalculated?: boolean
}

export type TableType = 'revenue' | 'expense' | 'lots' | 'revenue-deduction'
