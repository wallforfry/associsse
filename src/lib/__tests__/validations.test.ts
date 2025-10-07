import { describe, it, expect } from 'vitest'
import { 
  bankTransactionCsvRowSchema, 
  bankTransactionImportSchema,
  associateExpenseSchema 
} from '../validations'

describe('Bank Transaction Validations', () => {
  describe('bankTransactionCsvRowSchema', () => {
    it('should validate correct CSV row data', () => {
      const validData = {
        date: '13/08/2025',
        valueDate: '13/08/2025',
        amount: '50.00',
        description: 'Test transaction',
        balance: '100.00'
      }

      const result = bankTransactionCsvRowSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.amount).toBe(50)
        expect(result.data.balance).toBe(100)
      }
    })

    it('should transform amount strings to numbers', () => {
      const data = {
        date: '13/08/2025',
        valueDate: '13/08/2025',
        amount: '123.45',
        description: 'Test',
        balance: '1000.00'
      }

      const result = bankTransactionCsvRowSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.amount).toBe('number')
        expect(result.data.amount).toBe(123.45)
        expect(typeof result.data.balance).toBe('number')
        expect(result.data.balance).toBe(1000)
      }
    })

    it('should handle negative amounts', () => {
      const data = {
        date: '13/08/2025',
        valueDate: '13/08/2025',
        amount: '-50.00',
        description: 'Test',
        balance: '50.00'
      }

      const result = bankTransactionCsvRowSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.amount).toBe(-50)
      }
    })

    it('should reject invalid date format', () => {
      const data = {
        date: '2025-08-13', // Wrong format
        valueDate: '13/08/2025',
        amount: '50.00',
        description: 'Test',
        balance: '100.00'
      }

      const result = bankTransactionCsvRowSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid amount format', () => {
      const data = {
        date: '13/08/2025',
        valueDate: '13/08/2025',
        amount: 'invalid',
        description: 'Test',
        balance: '100.00'
      }

      const result = bankTransactionCsvRowSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid amount format')
      }
    })

    it('should reject empty description', () => {
      const data = {
        date: '13/08/2025',
        valueDate: '13/08/2025',
        amount: '50.00',
        description: '',
        balance: '100.00'
      }

      const result = bankTransactionCsvRowSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('bankTransactionImportSchema', () => {
    it('should validate array of transactions', () => {
      const validData = {
        transactions: [
          {
            date: '13/08/2025',
            valueDate: '13/08/2025',
            amount: '50.00',
            description: 'Test 1',
            balance: '100.00'
          },
          {
            date: '14/08/2025',
            valueDate: '14/08/2025',
            amount: '25.00',
            description: 'Test 2',
            balance: '125.00'
          }
        ]
      }

      const result = bankTransactionImportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty transactions array', () => {
      const data = {
        transactions: []
      }

      const result = bankTransactionImportSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('associateExpenseSchema', () => {
    it('should validate correct association data', () => {
      const validData = {
        expenseId: 'expense-123',
        amount: 50.00
      }

      const result = associateExpenseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const data = {
        expenseId: 'expense-123',
        amount: -50.00
      }

      const result = associateExpenseSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject zero amount', () => {
      const data = {
        expenseId: 'expense-123',
        amount: 0
      }

      const result = associateExpenseSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject empty expense ID', () => {
      const data = {
        expenseId: '',
        amount: 50.00
      }

      const result = associateExpenseSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
