import { describe, it, expect } from 'vitest'
import { parseCSV, parseFrenchDate, generateTransactionHash } from '../bank-utils'

describe('Bank Utils', () => {
  describe('parseCSV', () => {
    it('should parse CSV with correct headers', () => {
      const csvText = `Date,Date de valeur,Montant,Libellé,Solde
13/08/2025,13/08/2025,50.00,VIR INST WALLERAND DELEVACQ VIREMENT DE WALLERAND DELEVACQ,50.00
01/09/2025,01/09/2025,500.00,VIR INST WALLERAND DELEVACQ VIREMENT DE WALLERAND DELEVACQ LOCATION,550.00`

      const result = parseCSV(csvText)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        'Date': '13/08/2025',
        'Date de valeur': '13/08/2025',
        'Montant': '50.00',
        'Libellé': 'VIR INST WALLERAND DELEVACQ VIREMENT DE WALLERAND DELEVACQ',
        'Solde': '50.00'
      })
    })

    it('should handle empty lines', () => {
      const csvText = `Date,Date de valeur,Montant,Libellé,Solde
13/08/2025,13/08/2025,50.00,Test,50.00

01/09/2025,01/09/2025,500.00,Test 2,550.00`

      const result = parseCSV(csvText)

      expect(result).toHaveLength(2)
    })

    it('should handle CSV with missing values', () => {
      const csvText = `Date,Date de valeur,Montant,Libellé,Solde
13/08/2025,13/08/2025,50.00,Test,50.00
01/09/2025,01/09/2025,500.00,Test 2,550.00`

      const result = parseCSV(csvText)

      expect(result).toHaveLength(2)
      expect(result[1]).toEqual({
        'Date': '01/09/2025',
        'Date de valeur': '01/09/2025',
        'Montant': '500.00',
        'Libellé': 'Test 2',
        'Solde': '550.00'
      })
    })
  })

  describe('parseFrenchDate', () => {
    it('should parse French date format correctly', () => {
      const date = parseFrenchDate('13/08/2025')
      
      expect(date.getFullYear()).toBe(2025)
      expect(date.getMonth()).toBe(7) // August (0-indexed)
      expect(date.getDate()).toBe(13)
    })

    it('should handle different months correctly', () => {
      const date = parseFrenchDate('01/01/2024')
      
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // January (0-indexed)
      expect(date.getDate()).toBe(1)
    })
  })

  describe('generateTransactionHash', () => {
    it('should generate consistent hashes for same input', () => {
      const hash1 = generateTransactionHash('13/08/2025', '50.00', 'Test', 'org123')
      const hash2 = generateTransactionHash('13/08/2025', '50.00', 'Test', 'org123')
      
      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different inputs', () => {
      const hash1 = generateTransactionHash('13/08/2025', '50.00', 'Test', 'org123')
      const hash2 = generateTransactionHash('14/08/2025', '50.00', 'Test', 'org123')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should generate different hashes for different organizations', () => {
      const hash1 = generateTransactionHash('13/08/2025', '50.00', 'Test', 'org123')
      const hash2 = generateTransactionHash('13/08/2025', '50.00', 'Test', 'org456')
      
      expect(hash1).not.toBe(hash2)
    })
  })
})
