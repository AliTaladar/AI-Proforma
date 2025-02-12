import React, { useState } from 'react'
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
  Heading,
  FormLabel,
  Textarea,
  Button,
  toast
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
  handleAddRow: (type: TableType, label: string) => void
  handlePaste: (type: TableType, e: React.ClipboardEvent, rowId: string, columnIndex: number) => void
  handleDeleteRow: (type: TableType, rowId: string) => void
  setNewLabel: (value: string) => void
  showAddRow?: boolean
  showDelete?: boolean
  periodLabels: string[]
  handleBulkAdd?: (type: TableType, text: string) => void
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
  showDelete = true,
  periodLabels,
  handleBulkAdd
}) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const [blue500] = useToken('colors', ['blue.500'])
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [pasteContent, setPasteContent] = useState('')

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return useColorModeValue('green.500', 'green.300')
      case 'expense':
        return useColorModeValue('purple.500', 'purple.300')
      case 'lots':
        return useColorModeValue('blue.500', 'blue.300')
      case 'debt-financing':
        return useColorModeValue('orange.500', 'orange.300')
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
      case 'debt-financing':
        return 'Debt Financing'
      default:
        return ''
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const items = text.split(/[\n\r]+/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (items.length === 0) {
        toast({
          title: 'No items found',
          description: 'Please copy some items first',
          status: 'warning',
          duration: 2000,
          position: 'top-right',
          isClosable: true,
        });
        return;
      }

      // Process all items first
      const validItems = items.filter(item => item.trim().length > 0);
      
      // Add all items at once
      validItems.forEach(item => {
        handleAddRow(type, item);
      });

      // Show success message
      toast({
        title: `Added ${validItems.length} items`,
        status: 'success',
        duration: 2000,
        position: 'top-right',
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error reading clipboard',
        description: 'Please try copying your items again',
        status: 'error',
        duration: 2000,
        position: 'top-right',
        isClosable: true,
      });
    }
  };

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
        <Box p={4} bg={headerBg}>
          <Flex justify="space-between" align="center">
            <Heading size="sm" color={getTypeColor(type)}>
              {getTypeTitle(type)}
            </Heading>
            {showAddRow && (
              <Tooltip label="Paste multiple items from clipboard">
                <IconButton
                  aria-label="Paste from clipboard"
                  icon={<AddIcon />}
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={handlePasteFromClipboard}
                />
              </Tooltip>
            )}
          </Flex>
        </Box>

        {showAddRow && (
          <Box p={4} borderWidth={1} borderColor={borderColor} borderRadius="md" bg={bgColor}>
            <Flex direction="column" gap={4}>
              <Flex gap={2} alignItems="center">
                <Input
                  placeholder={`Add new ${type === 'revenue' ? 'gross revenue' : type.replace('-', ' ')} item...`}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newLabel.trim()) {
                      handleAddRow(type, newLabel)
                    }
                  }}
                  borderColor={borderColor}
                  _focus={{
                    borderColor: getTypeColor(type),
                    boxShadow: `0 0 0 1px ${getTypeColor(type)}`,
                  }}
                />
                <IconButton
                  aria-label="Add row"
                  icon={<AddIcon />}
                  size="xs"
                  colorScheme={
                    type === 'revenue' 
                      ? 'green' 
                      : type === 'expense' 
                      ? 'purple' 
                      : type === 'lots'
                      ? 'blue'
                      : type === 'debt-financing'
                      ? 'orange'
                      : 'gray'
                  }
                  onClick={() => newLabel.trim() && handleAddRow(type, newLabel)}
                  variant="ghost"
                />
                {handleBulkAdd && (
                  <IconButton
                    aria-label="Bulk add items"
                    icon={showPasteArea ? <ChevronRightIcon /> : <AddIcon />}
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    colorScheme="green"
                  />
                )}
              </Flex>
              {showPasteArea && handleBulkAdd && (
                <Box>
                  <FormLabel fontSize="sm">Paste items from spreadsheet (one per line):</FormLabel>
                  <Textarea
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder="Paste your items here..."
                    size="sm"
                    rows={5}
                  />
                  <Flex gap={2} mt={2}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => {
                        handleBulkAdd(type, pasteContent)
                        setPasteContent('')
                        setShowPasteArea(false)
                      }}
                      isDisabled={!pasteContent.trim()}
                    >
                      Add Items
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPasteContent('')
                        setShowPasteArea(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </Flex>
                </Box>
              )}
            </Flex>
          </Box>
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
              {showDelete && (
                <Th
                  w="60px"
                  py={4}
                  borderBottomWidth="2px"
                  borderBottomColor={getTypeColor(type)}
                />
              )}
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
              {type !== 'lots' && <Th
                minW="120px"
                py={4}
                borderBottomWidth="2px"
                borderBottomColor={getTypeColor(type)}
              >
                Per Unit
              </Th>}
              {periodLabels.map((label, index) => (
                <Th
                  key={index}
                  minW="150px"
                  py={4}
                  borderBottomWidth="2px"
                  borderBottomColor={getTypeColor(type)}
                >
                  <Flex align="center" gap={2}>
                    {label}
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
                {showDelete && !row.isCalculated && (
                  <Td w="60px">
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
                  </Td>
                )}
                {showDelete && row.isCalculated && <Td w="60px" />}
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
                {type !== 'lots' && <Td minW="120px" textAlign="right" fontWeight="medium" color={getTypeColor(type)}>
                  {row.perUnit?.toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: 'USD',
                    maximumFractionDigits: 2
                  })}
                </Td>}
                {row.values.map((value, colIndex) => (
                  <Td key={colIndex} minW="150px">
                    {(row.isCalculated && (type !== 'debt-financing' || row.id === 'ending-loan-balance')) ? (
                      <Text textAlign="right" fontWeight="medium" color={getTypeColor(type)}>
                        {type === 'lots'
                          ? parseFloat(value).toLocaleString('en-US', { maximumFractionDigits: 0 })
                          : parseFloat(value).toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0
                            })}
                      </Text>
                    ) : (
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        value={value}
                        onChange={(e) => handleCellChange(type, row.id, colIndex, e.target.value)}
                        onPaste={(e) => {
                          e.preventDefault();
                          console.log('Paste event in cell:', row.id, colIndex);
                          handlePaste(type, e, row.id, colIndex);
                        }}
                        onKeyDown={(e) => {
                          // Allow only numbers, backspace, delete, arrow keys, and tab
                          if (
                            !/[\d\.]/.test(e.key) && 
                            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) &&
                            !e.ctrlKey && // Allow Ctrl+V for paste
                            !e.metaKey // Allow Cmd+V for paste on Mac
                          ) {
                            e.preventDefault();
                          }
                        }}
                        size="sm"
                        textAlign="right"
                        variant="filled"
                        isReadOnly={row.isCalculated}
                        bg={row.isCalculated ? headerBg : bgColor}
                        _hover={{
                          bg: row.isCalculated ? headerBg : bgColor
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
