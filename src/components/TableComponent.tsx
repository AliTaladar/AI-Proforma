import React from 'react'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  IconButton,
  Text,
  useColorModeValue,
  Flex,
  Tooltip,
  Badge,
  useToken,
  InputGroup,
  InputRightElement,
  Heading
} from '@chakra-ui/react'
import { AddIcon, ChevronRightIcon, DeleteIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'
import { TableRow, TableType } from '../types/table'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)
const MotionTr = motion(Tr)

interface TableComponentProps {
  type: TableType
  rows: TableRow[]
  columns: number
  newLabel: string
  handleCellChange: (
    type: TableType,
    rowId: string,
    columnIndex: number,
    value: string
  ) => void
  handleAddRow: (type: TableType) => void
  handlePaste: (type: TableType, e: React.ClipboardEvent) => void
  handleDeleteRow: (type: TableType, rowId: string) => void
  setNewLabel: (value: string) => void
  showAddRow?: boolean
  showDelete?: boolean
}

const TableComponent: React.FC<TableComponentProps> = ({
  type,
  rows,
  columns,
  newLabel,
  handleCellChange,
  handleAddRow,
  handlePaste,
  handleDeleteRow,
  setNewLabel,
  showAddRow = true,
  showDelete = true
}) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const [blue500] = useToken('colors', ['blue.500'])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return useColorModeValue('green.500', 'green.300')
      case 'expense':
        return useColorModeValue('purple.500', 'purple.300')
      case 'lots':
        return useColorModeValue('blue.500', 'blue.300')
      case 'revenue-deduction':
        return useColorModeValue('red.500', 'red.300')
      default:
        return useColorModeValue('gray.500', 'gray.300')
    }
  }

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'Gross Revenue'
      case 'expense':
        return 'Expenses'
      case 'lots':
        return 'Lots'
      case 'revenue-deduction':
        return 'Revenue Deductions'
      default:
        return ''
    }
  }

  return (
    <MotionBox 
      mb={8}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <MotionFlex
        bg={bgColor}
        mb={6}
        p={6}
        borderRadius="xl"
        boxShadow="sm"
        direction="column"
        borderLeft="4px solid"
        borderLeftColor={getTypeColor(type)}
        _hover={{ boxShadow: 'md' }}
        transition="all 0.2s"
      >
        <Box mb={4}>
          <Heading size="md" color={getTypeColor(type)} mb={2}>
            {getTypeTitle(type)}
          </Heading>
          <Text fontSize="sm" color={textColor}>
            {rows.length} {rows.length === 1 ? 'item' : 'items'}
          </Text>
        </Box>

        {showAddRow && (
          <InputGroup size="sm" mb={4}>
            <Input
              placeholder={`Add new ${type === 'revenue' ? 'gross revenue' : type.replace('-', ' ')} item...`}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newLabel.trim()) {
                  handleAddRow(type)
                }
              }}
              borderColor={borderColor}
              _focus={{
                borderColor: getTypeColor(type),
                boxShadow: `0 0 0 1px ${getTypeColor(type)}`,
              }}
            />
            <InputRightElement>
              <IconButton
                aria-label="Add row"
                icon={<AddIcon />}
                size="xs"
                colorScheme={
                  type === 'revenue' 
                    ? 'green' 
                    : type === 'expense' 
                    ? 'purple' 
                    : type === 'revenue-deduction'
                    ? 'red'
                    : 'blue'
                }
                onClick={() => newLabel.trim() && handleAddRow(type)}
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        )}
      </MotionFlex>

      <Box
        overflowX="auto"
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        maxH="calc(50vh - 100px)"
        overflowY="auto"
        boxShadow="sm"
        css={{
          '&::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
            backgroundColor: useColorModeValue('gray.50', 'gray.800'),
          },
          '&::-webkit-scrollbar-track': {
            borderRadius: '8px',
            backgroundColor: useColorModeValue('gray.100', 'gray.700'),
            border: useColorModeValue('1px solid #E2E8F0', '1px solid rgba(255, 255, 255, 0.1)'),
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: useColorModeValue('gray.300', 'gray.600'),
            borderRadius: '8px',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: useColorModeValue('gray.50', 'gray.800'),
            '&:hover': {
              backgroundColor: useColorModeValue('gray.400', 'gray.500'),
            },
          },
          '&::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Table
          variant="simple"
          onPaste={(e) => handlePaste(type, e)}
          style={{ minWidth: 'max-content' }}
        >
          <Thead
            position="sticky"
            top={0}
            bg={headerBg}
            zIndex={1}
            boxShadow="sm"
          >
            <Tr>
              <Th
                w="60px"
                py={4}
                borderBottomWidth="2px"
                borderBottomColor={getTypeColor(type)}
              >
                
              </Th>
              <Th
                minW="200px"
                py={4}
                borderBottomWidth="2px"
                borderBottomColor={getTypeColor(type)}
              >
                Item
              </Th>
              <Th
                minW="120px"
                py={4}
                borderBottomWidth="2px"
                borderBottomColor={getTypeColor(type)}
              >
                Total
              </Th>
              <Th
                minW="120px"
                py={4}
                borderBottomWidth="2px"
                borderBottomColor={getTypeColor(type)}
              >
                Per Unit
              </Th>
              {Array.from({ length: Math.max(columns, rows[0]?.values.length || 0) }, (_, i) => (
                <Th
                  key={i}
                  minW="150px"
                  py={4}
                  borderBottomWidth="2px"
                  borderBottomColor={getTypeColor(type)}
                >
                  <Flex align="center" gap={2}>
                    Year {i + 1}
                    <ChevronRightIcon color={getTypeColor(type)} />
                  </Flex>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((row, rowIndex) => (
              <MotionTr
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
              >
                <Td w="60px">
                  {showDelete !== false && !row.isCalculated && (
                    <Tooltip label="Delete row" placement="right">
                      <IconButton
                        aria-label="Delete row"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteRow(type, row.id)}
                        _hover={{
                          bg: 'red.50',
                          color: 'red.600',
                        }}
                        _dark={{
                          _hover: {
                            bg: 'whiteAlpha.200',
                            color: 'red.300',
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                </Td>
                <Td minW="200px" fontWeight="medium">
                  {row.label}
                </Td>
                <Td minW="120px" textAlign="right" fontWeight="medium" color={getTypeColor(type)}>
                  {type === 'lots' 
                    ? row.total?.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : row.total?.toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        maximumFractionDigits: 0 
                      })}
                </Td>
                <Td minW="120px" textAlign="right" fontWeight="medium" color={getTypeColor(type)}>
                  {row.perUnit?.toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: 'USD',
                    maximumFractionDigits: 2
                  })}
                </Td>
                {row.values.map((value, index) => (
                  <Td key={index} minW="150px">
                    {row.isCalculated ? (
                      <Text
                        textAlign="right"
                        fontWeight="medium"
                        color={getTypeColor(type)}
                      >
                        {parseFloat(value).toLocaleString('en-US', { 
                          style: 'currency', 
                          currency: 'USD',
                          maximumFractionDigits: 0
                        })}
                      </Text>
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) =>
                          handleCellChange(type, row.id, index, e.target.value)
                        }
                        size="sm"
                        borderRadius="md"
                        textAlign="right"
                        _focus={{
                          borderColor: getTypeColor(type),
                          boxShadow: `0 0 0 1px ${getTypeColor(type)}`,
                        }}
                      />
                    )}
                  </Td>
                ))}
              </MotionTr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </MotionBox>
  )
}

export default TableComponent
