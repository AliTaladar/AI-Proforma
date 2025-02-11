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
  lotsRows: TableRow[];
  debtFinancingRows: TableRow[];
}

export default function ProformaTable() {
  const [revenueRows, setRevenueRows] = useState<TableRow[]>([])
  const [expenseRows, setExpenseRows] = useState<TableRow[]>([])
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
  const [debtFinancingRows, setDebtFinancingRows] = useState<TableRow[]>([
    {
      id: 'beginning-loan-balance',
      label: 'Beginning Loan Balance',
      values: Array(5).fill('0'),
      total: 0
    },
    {
      id: 'draws',
      label: 'Draws',
      values: Array(5).fill('0'),
      total: 0
    },
    {
      id: 'interest',
      label: 'Interest',
      values: Array(5).fill('0'),
      total: 0
    },
    {
      id: 'principal-repayment',
      label: 'Principal Repayment',
      values: Array(5).fill('0'),
      total: 0
    },
    {
      id: 'payoff',
      label: 'Payoff',
      values: Array(5).fill('0'),
      total: 0
    }
  ])
  const [newRevenueLabel, setNewRevenueLabel] = useState('')
  const [newExpenseLabel, setNewExpenseLabel] = useState('')
  const [newDebtFinancingLabel, setNewDebtFinancingLabel] = useState('')
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
    setRevenueRows(rows => {
      const updatedRows = rows.map(row => {
        if (row.isCalculated) return row;
        const total = row.values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
        const totalLotsSold = getTotalLotsSold()
        return {
          ...row,
          total,
          perUnit: totalLotsSold > 0 ? total / totalLotsSold : 0
        }
      })
      return updateRowsWithTotal(updatedRows, 'Total Gross Revenue')
    })
  }, [columns, lotsRows])

  useEffect(() => {
    setExpenseRows(rows => {
      const updatedRows = rows.map(row => {
        if (row.isCalculated) return row;
        const total = row.values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
        const totalLotsSold = getTotalLotsSold()
        return {
          ...row,
          total,
          perUnit: totalLotsSold > 0 ? total / totalLotsSold : 0
        }
      })
      return updateRowsWithTotal(updatedRows, 'Total Expenses')
    })
  }, [columns, lotsRows])

  useEffect(() => {
    setRevenueRows(rows => updateRowsWithTotal(rows, 'Total Gross Revenue'))
  }, [columns])

  useEffect(() => {
    setExpenseRows(rows => updateRowsWithTotal(rows, 'Total Expenses'))
  }, [columns])

  useEffect(() => {
    const calculateEndingLoanBalance = () => {
      const beginningBalance = debtFinancingRows.find(row => row.id === 'beginning-loan-balance')?.values || []
      const draws = debtFinancingRows.find(row => row.id === 'draws')?.values || []
      const principalRepayment = debtFinancingRows.find(row => row.id === 'principal-repayment')?.values || []
      const payoff = debtFinancingRows.find(row => row.id === 'payoff')?.values || []
      const existingEndingBalance = debtFinancingRows.find(row => row.id === 'ending-loan-balance')

      const endingBalanceValues = beginningBalance.map((_, index) => {
        const beginning = parseFloat(beginningBalance[index]) || 0
        const draw = parseFloat(draws[index]) || 0
        const principal = parseFloat(principalRepayment[index]) || 0
        const pay = parseFloat(payoff[index]) || 0
        return (beginning + draw - principal - pay).toString()
      })

      const endingBalanceTotal = endingBalanceValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)

      // Only update if values have changed
      if (!existingEndingBalance || 
          JSON.stringify(existingEndingBalance.values) !== JSON.stringify(endingBalanceValues) ||
          existingEndingBalance.total !== endingBalanceTotal) {
        
        const endingBalanceRow: TableRow = {
          id: 'ending-loan-balance',
          label: 'Ending Loan Balance',
          values: endingBalanceValues,
          total: endingBalanceTotal,
          isCalculated: true
        }

        setDebtFinancingRows(rows => {
          const nonEndingRows = rows.filter(row => row.id !== 'ending-loan-balance')
          return [...nonEndingRows, endingBalanceRow]
        })
      }
    }

    calculateEndingLoanBalance()
  }, [debtFinancingRows])

  useEffect(() => {
    setRevenueRows(rows => updateRowsWithTotal(rows.filter(row => !row.isCalculated), 'Total Gross Revenue'))
    setExpenseRows(rows => updateRowsWithTotal(rows.filter(row => !row.isCalculated), 'Total Expenses'))
  }, [lotsRows])

  useEffect(() => {
    // Expose table data to window object for AI Assistant
    (window as any).getProformaTableData = () => ({
      revenueRows,
      expenseRows,
      lotsRows,
      debtFinancingRows
    });

    // Cleanup
    return () => {
      delete (window as any).getProformaTableData;
    };
  }, [revenueRows, expenseRows, lotsRows, debtFinancingRows]);

  const handleCellChange = (
    type: 'revenue' | 'expense' | 'lots' | 'debt-financing',
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

    if (type === 'debt-financing') {
      setDebtFinancingRows(prevRows => {
        const updatedRows = prevRows.map(row => {
          if (row.id === rowId) {
            const newValues = [...row.values]
            newValues[columnIndex] = numericValue
            const total = newValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
            return { ...row, values: newValues, total }
          }
          return row
        })
        return updatedRows
      })
      return
    }

    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : setLotsRows

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses'
      : ''

    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.id === rowId) {
          const newValues = [...row.values]
          newValues[columnIndex] = numericValue
          const total = newValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
          const totalLotsSold = getTotalLotsSold()
          return {
            ...row,
            values: newValues,
            total,
            perUnit: type !== 'lots' && totalLotsSold > 0 ? total / totalLotsSold : undefined
          }
        }
        return row
      })

      if (type === 'lots') {
        return calculateRowTotals(updatedRows, 'lots')
      } else {
        return updateRowsWithTotal(updatedRows.filter(r => !r.isCalculated), totalLabel)
      }
    })
  }

  const handleAddRow = (type: 'revenue' | 'expense' | 'lots' | 'debt-financing') => {
    const label = type === 'revenue' 
      ? newRevenueLabel 
      : type === 'expense' 
      ? newExpenseLabel 
      : type === 'debt-financing'
      ? newDebtFinancingLabel
      : ''
    const setLabel = type === 'revenue' 
      ? setNewRevenueLabel 
      : type === 'expense' 
      ? setNewExpenseLabel 
      : type === 'debt-financing'
      ? setNewDebtFinancingLabel
      : () => {}
    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : type === 'debt-financing'
      ? setDebtFinancingRows
      : setLotsRows

    if (type !== 'lots' && type !== 'debt-financing' && !label.trim()) {
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
      label: type === 'lots' ? `Lots ${lotsRows.length + 1}` : type === 'debt-financing' ? `Debt Financing ${debtFinancingRows.length + 1}` : label,
      values: Array(columns).fill('0'),
      total: 0,
      perUnit: type === 'lots' ? undefined : 0
    }

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses'
      : type === 'debt-financing'
      ? 'Ending Loan Balance'
      : ''

    const calculatedNewRow = calculateRowTotals([newRow], type === 'lots' ? 'lots' : undefined)[0]

    if (type === 'revenue') {
      setRevenueRows(rows => updateRowsWithTotal([...rows.filter(r => !r.isCalculated), calculatedNewRow], totalLabel))
      setNewRevenueLabel('')
    } else if (type === 'expense') {
      setExpenseRows(rows => updateRowsWithTotal([...rows.filter(r => !r.isCalculated), calculatedNewRow], totalLabel))
      setNewExpenseLabel('')
    } else if (type === 'debt-financing') {
      setDebtFinancingRows(rows => [...rows.filter(r => !r.isCalculated), calculatedNewRow])
      setNewDebtFinancingLabel('')
    } else {
      setLotsRows(rows => calculateRowTotals([...rows, calculatedNewRow], 'lots'))
    }

    toast({
      title: `${type === 'revenue' ? 'Gross Revenue' : type === 'expense' ? 'Expense' : type === 'debt-financing' ? 'Debt Financing' : 'Lots'} item added`,
      status: 'success',
      duration: 2000,
      position: 'top-right',
      isClosable: true,
    })
  }

  const handlePaste = (type: 'revenue' | 'expense' | 'lots' | 'debt-financing', e: React.ClipboardEvent) => {
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
      setLotsRows(updateRowsWithNewColumns)
      setDebtFinancingRows(updateRowsWithNewColumns)
    }

    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : type === 'debt-financing'
      ? setDebtFinancingRows
      : setLotsRows

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses'
      : type === 'debt-financing'
      ? 'Ending Loan Balance'
      : ''

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
      return type === 'lots' || type === 'debt-financing' ? calculateRowTotals(updatedRows, type === 'lots' ? 'lots' : undefined) : updateRowsWithTotal(updatedRows, totalLabel)
    })
  }

  const handleDeleteRow = (type: 'revenue' | 'expense' | 'lots' | 'debt-financing', rowId: string) => {
    const setRows = type === 'revenue' 
      ? setRevenueRows 
      : type === 'expense' 
      ? setExpenseRows 
      : type === 'debt-financing'
      ? setDebtFinancingRows
      : setLotsRows

    const totalLabel = type === 'revenue' 
      ? 'Total Gross Revenue' 
      : type === 'expense' 
      ? 'Total Expenses'
      : type === 'debt-financing'
      ? 'Ending Loan Balance'
      : ''

    setRows(rows => {
      const updatedRows = rows.filter(row => !row.isCalculated && row.id !== rowId)
      return type === 'lots' || type === 'debt-financing' ? calculateRowTotals(updatedRows, type === 'lots' ? 'lots' : undefined) : updateRowsWithTotal(updatedRows, totalLabel)
    })
    
    toast({
      title: `${type === 'revenue' ? 'Gross Revenue' : type === 'expense' ? 'Expense' : type === 'debt-financing' ? 'Debt Financing' : 'Lots'} item deleted`,
      status: 'success',
      duration: 2000,
      position: 'top-right',
      isClosable: true,
    })
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg" mb={4} bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`} bgClip="text">
            Proforma Analysis
          </Heading>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
          />
        </Flex>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Lots</Text>
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
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Gross Revenue</Text>
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
          />
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Expenses</Text>
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
          />
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Debt Financing</Text>
          <TableComponent
            type="debt-financing"
            rows={debtFinancingRows}
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
        </Box>
      </VStack>
    </Container>
  )
}
