'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  useToast, 
  Container, 
  VStack, 
  Heading, 
  Text,
  useColorMode,
  IconButton,
  Flex,
  useColorModeValue
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import TableComponent from './TableComponent'
import { v4 as uuidv4 } from 'uuid'

interface TableRow {
  id: string
  label: string
  values: string[]
  total: number
  perUnit?: number
  isCalculated?: boolean
}

export interface TableData {
  revenueRows: TableRow[];
  expenseRows: TableRow[];
  revenueDeductionRows: TableRow[];
  lotsRows: TableRow[];
}

export default function ProformaTable() {
  const [revenueRows, setRevenueRows] = useState<TableRow[]>([])
  const [expenseRows, setExpenseRows] = useState<TableRow[]>([])
  const [revenueDeductionRows, setRevenueDeductionRows] = useState<TableRow[]>([])
  const [lotsRows, setLotsRows] = useState<TableRow[]>([
    {
      id: 'lots-developed',
      label: 'Lots Developed',
      values: Array(5).fill('0'),
      total: 0,
      perUnit: undefined
    },
    {
      id: 'lots-sold',
      label: 'Lots Sold',
      values: Array(5).fill('0'),
      total: 0,
      perUnit: undefined
    }
  ])
  const [newRevenueLabel, setNewRevenueLabel] = useState('')
  const [newExpenseLabel, setNewExpenseLabel] = useState('')
  const [newRevenueDeductionLabel, setNewRevenueDeductionLabel] = useState('')
  const [columns, setColumns] = useState(5)
  const toast = useToast()
  const { colorMode, toggleColorMode } = useColorMode()
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const gradientStart = useColorModeValue('blue.400', 'blue.200')
  const gradientEnd = useColorModeValue('purple.500', 'purple.300')

  const getTotalLotsSold = () => {
    const lotsSoldRow = lotsRows.find(row => row.id === 'lots-sold')
    if (!lotsSoldRow) return 0
    return lotsSoldRow.total
  }

  const calculateRowTotals = (rows: TableRow[], type?: 'lots'): TableRow[] => {
    const totalLotsSold = getTotalLotsSold()
    return rows.map(row => {
      const numericValues = row.values.map(v => parseFloat(v) || 0)
      const total = numericValues.reduce((sum, val) => sum + val, 0)
      
      return {
        ...row,
        total,
        perUnit: type === 'lots' ? undefined : totalLotsSold > 0 ? total / totalLotsSold : 0
      }
    })
  }

  const calculateTotalRow = (rows: TableRow[], label: string): TableRow => {
    const totalLotsSold = getTotalLotsSold()
    
    const totalValues = Array(columns).fill('0').map((_, colIndex) => {
      const sum = rows
        .filter(row => !row.isCalculated)
        .reduce((total, row) => total + (parseFloat(row.values[colIndex]) || 0), 0)
      return sum.toString()
    })

    const rowTotal = totalValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)

    return {
      id: `total-${label.toLowerCase().replace(' ', '-')}`,
      label,
      values: totalValues,
      total: rowTotal,
      perUnit: totalLotsSold > 0 ? rowTotal / totalLotsSold : 0,
      isCalculated: true
    }
  }

  const updateRowsWithTotal = (rows: TableRow[], label: string): TableRow[] => {
    const regularRows = rows.filter(row => !row.isCalculated)
    const totalRow = calculateTotalRow(regularRows, label)
    return [...regularRows, totalRow]
  }

  useEffect(() => {
    setRevenueRows(rows => updateRowsWithTotal(rows, 'Total Gross Revenue'))
  }, [columns])

  useEffect(() => {
    setRevenueDeductionRows(rows => updateRowsWithTotal(rows, 'Net Revenue'))
  }, [columns])

  useEffect(() => {
    setExpenseRows(rows => updateRowsWithTotal(rows, 'Total Expenses'))
  }, [columns])

  useEffect(() => {
    setRevenueRows(rows => updateRowsWithTotal(rows.filter(row => !row.isCalculated), 'Total Gross Revenue'))
    setExpenseRows(rows => updateRowsWithTotal(rows.filter(row => !row.isCalculated), 'Total Expenses'))
    setRevenueDeductionRows(rows => updateRowsWithTotal(rows.filter(row => !row.isCalculated), 'Net Revenue'))
  }, [lotsRows])

  const handleCellChange = (
    type: 'revenue' | 'expense' | 'lots' | 'revenue-deduction',
    rowId: string,
    columnIndex: number,
    value: string
  ) => {
    const numericValue = value.trim() === '' ? '0' : value.replace(/[^\d.-]/g, '')
    if (isNaN(parseFloat(numericValue)) && value !== '') {
      toast({
        title: 'Invalid input',
        description: 'Please enter a valid number',
        status: 'error',
        duration: 2000,
        position: 'top-right',
        isClosable: true,
      })
      return
    }

    if (type === 'lots') {
      setLotsRows(rows => {
        const newLotsRows = rows.map(row => {
          if (row.id === rowId) {
            const newValues = row.values.map((v, i) => (i === columnIndex ? numericValue : v))
            const total = newValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
            return { 
              ...row, 
              values: newValues,
              total
            }
          }
          return row
        })
        return newLotsRows
      })

      // After updating lots, we need to update per unit values in other tables
      const totalLotsSold = getTotalLotsSold()
      setRevenueRows(rows => calculateRowTotals(rows.filter(row => !row.isCalculated)))
      setExpenseRows(rows => calculateRowTotals(rows.filter(row => !row.isCalculated)))
      setRevenueDeductionRows(rows => calculateRowTotals(rows.filter(row => !row.isCalculated)))
      return
    }

    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : setRevenueDeductionRows

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses' 
      : 'Net Revenue'

    const totalLotsSold = getTotalLotsSold()
    setRows(rows => {
      const updatedRows = rows
        .filter(row => !row.isCalculated)
        .map(row => {
          if (row.id === rowId) {
            const newValues = row.values.map((v, i) => (i === columnIndex ? numericValue : v))
            const total = newValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
            return { 
              ...row, 
              values: newValues,
              total,
              perUnit: totalLotsSold > 0 ? total / totalLotsSold : 0
            }
          }
          // Also update perUnit for other rows
          return {
            ...row,
            perUnit: totalLotsSold > 0 ? row.total / totalLotsSold : 0
          }
        })
      return updateRowsWithTotal(updatedRows, totalLabel)
    })
  }

  const handleAddRow = (type: 'revenue' | 'expense' | 'lots' | 'revenue-deduction') => {
    const label = type === 'revenue' 
      ? newRevenueLabel 
      : type === 'expense' 
      ? newExpenseLabel 
      : type === 'lots'
      ? ''
      : newRevenueDeductionLabel
    const setLabel = type === 'revenue' 
      ? setNewRevenueLabel 
      : type === 'expense' 
      ? setNewExpenseLabel 
      : type === 'lots'
      ? () => {}
      : setNewRevenueDeductionLabel
    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : type === 'lots'
      ? setLotsRows
      : setRevenueDeductionRows

    if (type !== 'lots' && !label.trim()) {
      toast({
        title: 'Label is required',
        description: 'Please enter a label for the new item',
        status: 'error',
        duration: 2000,
        position: 'top-right',
        isClosable: true,
      })
      return
    }

    const newRow: TableRow = {
      id: uuidv4(),
      label: type === 'lots' ? `Lots ${lotsRows.length + 1}` : label,
      values: Array(columns).fill('0'),
      total: 0,
      perUnit: type === 'lots' ? undefined : 0
    }

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses' 
      : type === 'lots'
      ? ''
      : 'Net Revenue'

    const calculatedNewRow = calculateRowTotals([newRow], type === 'lots' ? 'lots' : undefined)[0]

    if (type === 'revenue') {
      setRevenueRows(rows => updateRowsWithTotal([...rows.filter(r => !r.isCalculated), calculatedNewRow], totalLabel))
      setNewRevenueLabel('')
    } else if (type === 'expense') {
      setExpenseRows(rows => updateRowsWithTotal([...rows.filter(r => !r.isCalculated), calculatedNewRow], totalLabel))
      setNewExpenseLabel('')
    } else if (type === 'lots') {
      setLotsRows(rows => calculateRowTotals([...rows, calculatedNewRow], 'lots'))
    } else {
      setRevenueDeductionRows(rows => updateRowsWithTotal([...rows.filter(r => !r.isCalculated), calculatedNewRow], totalLabel))
      setNewRevenueDeductionLabel('')
    }

    toast({
      title: `${type === 'revenue' ? 'Gross Revenue' : type === 'expense' ? 'Expense' : type === 'lots' ? 'Lots' : 'Revenue Deduction'} item added`,
      status: 'success',
      duration: 2000,
      position: 'top-right',
      isClosable: true,
    })
  }

  const handlePaste = (type: 'revenue' | 'expense' | 'lots' | 'revenue-deduction', e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text')
    const pastedRows = pasteData.split('\n').map((row) => row.split('\t'))

    const maxPastedColumns = Math.max(...pastedRows.map((row) => row.length))

    if (maxPastedColumns > columns) {
      setColumns(maxPastedColumns)
      const updateRowsWithNewColumns = (rows: TableRow[]) => 
        rows.map((row) => ({
          ...row,
          values: [...row.values, ...Array(maxPastedColumns - row.values.length).fill('0')],
        }))

      setRevenueRows(updateRowsWithNewColumns)
      setExpenseRows(updateRowsWithNewColumns)
      setRevenueDeductionRows(updateRowsWithNewColumns)
      setLotsRows(updateRowsWithNewColumns)
    }

    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : type === 'lots'
      ? setLotsRows
      : setRevenueDeductionRows

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses' 
      : type === 'lots'
      ? ''
      : 'Net Revenue'

    setRows((prevRows) => {
      const updatedRows = prevRows.map((row, rowIndex) => {
        if (rowIndex < pastedRows.length) {
          const newValues = [...row.values]
          pastedRows[rowIndex].forEach((value, colIndex) => {
            if (colIndex < maxPastedColumns) {
              const numericValue = value.trim() === '' ? '0' : value.replace(/[^\d.-]/g, '')
              newValues[colIndex] = isNaN(parseFloat(numericValue)) ? '0' : numericValue
            }
          })
          return {
            ...row,
            values: newValues,
          }
        }
        return row
      })
      return type === 'lots' ? calculateRowTotals(updatedRows, 'lots') : updateRowsWithTotal(updatedRows, totalLabel)
    })
  }

  const handleDeleteRow = (type: 'revenue' | 'expense' | 'lots' | 'revenue-deduction', rowId: string) => {
    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : type === 'lots'
      ? setLotsRows
      : setRevenueDeductionRows

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses' 
      : type === 'lots'
      ? ''
      : 'Net Revenue'

    setRows(rows => {
      const updatedRows = rows.filter(row => !row.isCalculated && row.id !== rowId)
      return type === 'lots' ? calculateRowTotals(updatedRows, 'lots') : updateRowsWithTotal(updatedRows, totalLabel)
    })
    
    toast({
      title: `${type === 'revenue' ? 'Gross Revenue' : type === 'expense' ? 'Expense' : type === 'lots' ? 'Lots' : 'Revenue Deduction'} item deleted`,
      status: 'success',
      duration: 2000,
      position: 'top-right',
      isClosable: true,
    })
  }

  // Function to get current table data
  const getTableData = (): TableData => ({
    revenueRows,
    expenseRows,
    revenueDeductionRows,
    lotsRows
  })

  // Make getTableData available globally
  useEffect(() => {
    ;(window as any).getProformaTableData = getTableData
  }, [revenueRows, expenseRows, revenueDeductionRows, lotsRows])

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" mb={8}>
          <Box flex="1" textAlign="center" position="relative">
            <IconButton
              aria-label="Toggle dark mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              position="absolute"
              right="0"
              top="0"
              size="lg"
              variant="ghost"
              color={colorMode === 'light' ? 'gray.600' : 'yellow.300'}
              _hover={{
                bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200'
              }}
            />
            <Heading
              bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
              bgClip="text"
              fontSize="3xl"
            >
              AI Proforma
            </Heading>
            <Text color={textColor} fontSize="lg">
              Track and manage your revenue and expenses projections
            </Text>
          </Box>
        </Flex>

        <TableComponent
          type="lots"
          rows={lotsRows}
          columns={columns}
          newLabel=""
          handleCellChange={handleCellChange}
          handleAddRow={handleAddRow}
          handlePaste={handlePaste}
          handleDeleteRow={handleDeleteRow}
          setNewLabel={() => {}}
          showAddRow={false}
          showDelete={false}
        />

        <TableComponent
          type="revenue"
          rows={revenueRows}
          columns={columns}
          newLabel={newRevenueLabel}
          handleCellChange={handleCellChange}
          handleAddRow={handleAddRow}
          handlePaste={handlePaste}
          handleDeleteRow={handleDeleteRow}
          setNewLabel={setNewRevenueLabel}
          showAddRow={true}
        />

        <TableComponent
          type="revenue-deduction"
          rows={revenueDeductionRows}
          columns={columns}
          newLabel={newRevenueDeductionLabel}
          handleCellChange={handleCellChange}
          handleAddRow={handleAddRow}
          handlePaste={handlePaste}
          handleDeleteRow={handleDeleteRow}
          setNewLabel={setNewRevenueDeductionLabel}
          showAddRow={true}
        />

        <TableComponent
          type="expense"
          rows={expenseRows}
          columns={columns}
          newLabel={newExpenseLabel}
          handleCellChange={handleCellChange}
          handleAddRow={handleAddRow}
          handlePaste={handlePaste}
          handleDeleteRow={handleDeleteRow}
          setNewLabel={setNewExpenseLabel}
          showAddRow={true}
        />
      </VStack>
    </Container>
  )
}
