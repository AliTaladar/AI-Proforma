'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  useColorModeValue,
  FormControl,
  FormLabel,
  Select,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack
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
  periodType: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
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
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('yearly')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 5) // Default to 5 years from now
    return date
  })
  const [newRevenueLabel, setNewRevenueLabel] = useState('')
  const [newExpenseLabel, setNewExpenseLabel] = useState('')
  const [newDebtFinancingLabel, setNewDebtFinancingLabel] = useState('')
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
  const [pasteType, setPasteType] = useState<'revenue' | 'expense' | 'lots' | 'debt-financing' | null>(null)
  const toast = useToast()
  const { colorMode, toggleColorMode } = useColorMode()
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const gradientStart = useColorModeValue('blue.400', 'blue.200')
  const gradientEnd = useColorModeValue('purple.500', 'purple.300')
  const [periodLabels, setPeriodLabels] = useState<string[]>([])

  const getTotalLotsSold = () => {
    const lotsSoldRow = lotsRows.find(row => row.id === 'lots-sold')
    if (!lotsSoldRow) return 0
    return lotsSoldRow.total
  }

  const calculateRowTotals = (rows: TableRow[], type?: 'lots'): TableRow[] => {
    // Calculate total lots sold
    const lotsSoldRow = rows.find(row => row.id === 'lots-sold')
    const totalLotsSold = lotsSoldRow
      ? lotsSoldRow.values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
      : 0

    // Calculate total values for each row
    const updatedRows = rows.map(row => {
      if (row.isCalculated) return row
      const total = row.values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
      return {
        ...row,
        total,
        perUnit: type !== 'lots' && totalLotsSold > 0 ? total / totalLotsSold : undefined
      }
    })

    if (type === 'lots') {
      // For lots table, add a "Total Lots Sold" row
      const totalValues = Array(periodLabels.length).fill(0).map((_, colIndex) => {
        const sum = updatedRows
          .filter(row => !row.isCalculated)
          .reduce((total, row) => total + (parseFloat(row.values[colIndex]) || 0), 0)
        return sum.toString()
      })

      const totalRow: TableRow = {
        id: 'lots-sold',
        label: 'Total Lots Sold',
        values: totalValues,
        total: totalValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
        isCalculated: true
      }

      return [...updatedRows.filter(row => row.id !== 'lots-sold'), totalRow]
    }

    return updatedRows
  }

  const updateRowsWithTotal = (regularRows: TableRow[], totalLabel: string) => {
    // Calculate total values for each period
    const totalValues = Array(periodLabels.length).fill(0).map((_, colIndex) => {
      const sum = regularRows.reduce((acc, row) => acc + (parseFloat(row.values[colIndex]) || 0), 0);
      return sum.toString();
    });

    // Calculate grand total
    const grandTotal = totalValues.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    // Create total row
    const totalRow: TableRow = {
      id: totalLabel.toLowerCase().replace(/\s+/g, '-'),
      label: totalLabel,
      values: totalValues,
      total: grandTotal,
      perUnit: getTotalLotsSold() > 0 ? grandTotal / getTotalLotsSold() : 0,
      isCalculated: true
    };

    return [...regularRows, totalRow];
  }

  const calculateTotalRow = (rows: TableRow[], label: string): TableRow => {
    const totalLotsSold = getTotalLotsSold()
    
    const totalValues = Array(periodLabels.length).fill('0').map((_, colIndex) => {
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

  useEffect(() => {
    const timezoneOffset = startDate.getTimezoneOffset() * 60000;
    const start = new Date(startDate.getTime() + timezoneOffset);
    const end = new Date(endDate.getTime() + timezoneOffset);

    // Calculate the number of periods between start and end dates
    const getNumberOfPeriods = () => {
      if (periodType === 'yearly') {
        return end.getFullYear() - start.getFullYear() + 1;
      } else {
        return (
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth()) + 1
        );
      }
    };

    const numberOfPeriods = Math.max(1, Math.min(getNumberOfPeriods(), 60)); // Cap at 60 periods

    const labels = Array.from({ length: numberOfPeriods }, (_, i) => {
      const currentDate = new Date(start);
      if (periodType === 'yearly') {
        currentDate.setFullYear(start.getFullYear() + i);
        return currentDate.getFullYear().toString();
      } else {
        currentDate.setMonth(start.getMonth() + i);
        return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }
    });

    setPeriodLabels(labels);

    // Initialize or adjust row values if needed
    const adjustRowValues = (rows: TableRow[]) => {
      return rows.map(row => ({
        ...row,
        values: row.values.length === labels.length 
          ? row.values 
          : Array(labels.length).fill('0')
      }));
    };

    setRevenueRows(prev => adjustRowValues(prev));
    setExpenseRows(prev => adjustRowValues(prev));
    setLotsRows(prev => adjustRowValues(prev));
    setDebtFinancingRows(prev => adjustRowValues(prev));

  }, [startDate, endDate, periodType])

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
  }, [lotsRows])

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
  }, [lotsRows])

  useEffect(() => {
    setRevenueRows(rows => updateRowsWithTotal(rows, 'Total Gross Revenue'))
  }, [])

  useEffect(() => {
    setExpenseRows(rows => updateRowsWithTotal(rows, 'Total Expenses'))
  }, [])

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
      return updateRowsWithTotal(updatedRows.filter(r => !r.isCalculated), 'Total Gross Revenue')
    })
  }, [lotsRows])

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
      return updateRowsWithTotal(updatedRows.filter(r => !r.isCalculated), 'Total Expenses')
    })
  }, [lotsRows])

  useEffect(() => {
    // Expose table data to window object for AI Assistant
    (window as any).getProformaTableData = () => ({
      revenueRows,
      expenseRows,
      lotsRows,
      debtFinancingRows,
      periodType,
      startDate,
      endDate
    });

    // Cleanup
    return () => {
      delete (window as any).getProformaTableData;
    };
  }, [revenueRows, expenseRows, lotsRows, debtFinancingRows, periodType, startDate, endDate]);

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
      values: Array(periodLabels.length).fill('0'),
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

  const handlePaste = (
    type: 'revenue' | 'expense' | 'lots' | 'debt-financing', 
    e: React.ClipboardEvent,
    rowId: string,
    columnIndex: number
  ) => {
    e.preventDefault()
    console.log('Paste event triggered for row:', rowId, 'column:', columnIndex)
    
    const pasteData = e.clipboardData.getData('text/plain')
    console.log('Paste data:', pasteData)
    
    if (!pasteData) {
      console.log('No paste data available')
      return
    }
    
    // Split the pasted data into rows and columns
    const rows = pasteData
      .split(/[\n\r]+/)
      .map(row => {
        // Split row into cells and trim each cell
        const cells = row.split(/\t/).map(cell => cell.trim());
        // If all cells in a row are empty, fill them with '0'
        if (cells.every(cell => cell === '')) {
          return Array(periodLabels.length).fill('0');
        }
        return cells;
      });
    
    console.log('Parsed rows:', rows)
    
    if (rows.length === 0) {
      console.log('No rows to paste')
      return
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

    setRows(prevRows => {
      let updatedRows = [...prevRows]
      const startRowIndex = updatedRows.findIndex(row => row.id === rowId)
      if (startRowIndex === -1) {
        console.log('Row not found:', rowId)
        return prevRows
      }

      console.log('Updating rows starting at index:', startRowIndex)

      // Update each cell with pasted data
      rows.forEach((rowData, rowOffset) => {
        const targetRowIndex = startRowIndex + rowOffset
        if (targetRowIndex >= updatedRows.length) {
          console.log('Row index out of bounds:', targetRowIndex)
          return
        }

        rowData.forEach((cellValue, colOffset) => {
          const targetColIndex = columnIndex + colOffset
          if (targetColIndex >= periodLabels.length) {
            console.log('Column index out of bounds:', targetColIndex)
            return
          }

          // Convert the cell value to a number or 0 if invalid
          const numericValue = cellValue === '' ? '0' : cellValue.replace(/[^\d.-]/g, '')
          const value = isNaN(parseFloat(numericValue)) ? '0' : numericValue

          console.log('Setting value at', targetRowIndex, targetColIndex, ':', value, 'original:', cellValue)

          // Update the cell value
          updatedRows[targetRowIndex] = {
            ...updatedRows[targetRowIndex],
            values: updatedRows[targetRowIndex].values.map((v, i) => 
              i === targetColIndex ? value : v
            )
          }
        })
      })

      // Recalculate totals and per-unit values
      updatedRows = updatedRows.map(row => {
        if (row.isCalculated) return row
        const total = row.values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
        const totalLotsSold = getTotalLotsSold()
        return {
          ...row,
          total,
          perUnit: type !== 'lots' && totalLotsSold > 0 ? total / totalLotsSold : undefined
        }
      })

      if (type === 'lots') {
        return calculateRowTotals(updatedRows, 'lots')
      } else if (type === 'debt-financing') {
        return updatedRows
      } else {
        return updateRowsWithTotal(updatedRows.filter(r => !r.isCalculated), totalLabel)
      }
    })

    toast({
      title: 'Data pasted successfully',
      status: 'success',
      duration: 2000,
      position: 'top-right',
      isClosable: true,
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

  const handleBulkAdd = (type: 'revenue' | 'expense' | 'lots' | 'debt-financing', text: string) => {
    const items = text.split(/[\n\r]+/).map(item => item.trim()).filter(item => item.length > 0)
    
    items.forEach(label => {
      const newRow: TableRow = {
        id: uuidv4(),
        label: label.trim(),
        values: Array(periodLabels.length).fill('0'),
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
      } else if (type === 'expense') {
        setExpenseRows(rows => updateRowsWithTotal([...rows.filter(r => !r.isCalculated), calculatedNewRow], totalLabel))
      } else if (type === 'debt-financing') {
        setDebtFinancingRows(rows => [...rows.filter(r => !r.isCalculated), calculatedNewRow])
      } else {
        setLotsRows(rows => calculateRowTotals([...rows, calculatedNewRow], 'lots'))
      }
    })

    if (items.length > 0) {
      toast({
        title: `Added ${items.length} new ${type === 'revenue' ? 'revenue' : type === 'expense' ? 'expense' : type === 'debt-financing' ? 'debt financing' : 'lots'} items`,
        status: 'success',
        duration: 2000,
        position: 'top-right',
        isClosable: true,
      })
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="lg" bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`} bgClip="text">
            Proforma Analysis
          </Heading>
          <HStack spacing={4}>
            <FormControl w="200px">
              <FormLabel>Period Type</FormLabel>
              <Select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'yearly')}
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </FormControl>
            
            <FormControl w="200px">
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const inputDate = new Date(e.target.value);
                  const timezoneOffset = inputDate.getTimezoneOffset() * 60000;
                  const adjustedDate = new Date(inputDate.getTime() + timezoneOffset);
                  setStartDate(adjustedDate);
                }}
              />
            </FormControl>
            
            <FormControl w="200px">
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const inputDate = new Date(e.target.value);
                  const timezoneOffset = inputDate.getTimezoneOffset() * 60000;
                  const adjustedDate = new Date(inputDate.getTime() + timezoneOffset);
                  setEndDate(adjustedDate);
                }}
              />
            </FormControl>

            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
            />
          </HStack>
        </Flex>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Lots</Text>
          <TableComponent
            type="lots"
            rows={lotsRows}
            columns={periodLabels.length}
            newLabel=""
            handleCellChange={handleCellChange}
            handleAddRow={handleAddRow}
            handlePaste={handlePaste}
            handleDeleteRow={handleDeleteRow}
            setNewLabel={() => {}}
            showAddRow={false}
            showDelete={false}
            periodLabels={periodLabels}
          />
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Gross Revenue</Text>
          <TableComponent
            type="revenue"
            rows={revenueRows}
            columns={periodLabels.length}
            newLabel={newRevenueLabel}
            handleCellChange={handleCellChange}
            handleAddRow={handleAddRow}
            handlePaste={handlePaste}
            handleDeleteRow={handleDeleteRow}
            setNewLabel={setNewRevenueLabel}
            periodLabels={periodLabels}
            handleBulkAdd={handleBulkAdd}
          />
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Expenses</Text>
          <TableComponent
            type="expense"
            rows={expenseRows}
            columns={periodLabels.length}
            newLabel={newExpenseLabel}
            handleCellChange={handleCellChange}
            handleAddRow={handleAddRow}
            handlePaste={handlePaste}
            handleDeleteRow={handleDeleteRow}
            setNewLabel={setNewExpenseLabel}
            periodLabels={periodLabels}
            handleBulkAdd={handleBulkAdd}
          />
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Debt Financing</Text>
          <TableComponent
            type="debt-financing"
            rows={debtFinancingRows}
            columns={periodLabels.length}
            newLabel=""
            handleCellChange={handleCellChange}
            handleAddRow={handleAddRow}
            handlePaste={handlePaste}
            handleDeleteRow={handleDeleteRow}
            setNewLabel={() => {}}
            showAddRow={false}
            showDelete={false}
            periodLabels={periodLabels}
          />
        </Box>
      </VStack>
    </Container>
  )
}
