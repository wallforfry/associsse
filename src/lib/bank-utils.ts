import { createHash } from 'crypto'
import * as iconv from 'iconv-lite'

/**
 * Generate a unique hash for a bank transaction to avoid duplicates
 */
export function generateTransactionHash(
  date: string,
  amount: string,
  description: string,
  balance: string,
  organizationId: string
): string {
  const data = `${date}-${amount}-${description}-${balance}-${organizationId}`
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Parse French date format (DD/MM/YYYY) to Date object
 */
export function parseFrenchDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

/**
 * Parse CSV text into array of objects
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  const transactions = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(',').map(v => v.trim())
    if (values.length !== headers.length) continue
    
    const transaction: Record<string, string> = {}
    headers.forEach((header, index) => {
      transaction[header] = values[index]
    })
    transactions.push(transaction)
  }
  
  return transactions
}

/**
 * Format amount as currency
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Detect and handle different text encodings for CSV files using iconv-lite
 * Supports UTF-8, ISO 8859-2 (Latin-2), Windows-1252, and many others
 */
export async function handleFileEncoding(file: File): Promise<string> {
  try {
    // Get the raw bytes first
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Try different encodings in order of preference
    const encodings = [
      'iso-8859-2', // Latin-2 (Central/Eastern Europe)
      'utf8',
      'windows-1252', // CP1252 (Western Europe)
      'iso-8859-1', // Latin-1
      'cp1250', // Windows-1250 (Central Europe)
      'cp1251', // Windows-1251 (Cyrillic)
      'latin1'
    ]
    
    let bestResult = ''
    let bestScore = -1
    
    for (const encoding of encodings) {
      try {
        // Check if iconv-lite supports this encoding
        if (!iconv.encodingExists(encoding)) {
          continue
        }
        
        const decodedText = iconv.decode(buffer, encoding)
        
        // Score the decoded text quality
        const score = scoreTextQuality(decodedText)
        
        if (score > bestScore) {
          bestScore = score
          bestResult = decodedText
        }
        
        // If we get a perfect score, use it immediately
        if (score >= 100) {
          console.log(`Perfect match with ${encoding}`)
          return decodedText
        }
      } catch {
        // This encoding failed, try the next one
        continue
      }
    }
    
    // Return the best result we found
    if (bestResult) {
      console.log(`Using best encoding match (score: ${bestScore})`)
      return bestResult
    }
    
    // Final fallback to UTF-8
    return iconv.decode(buffer, 'utf8')
    
  } catch (error) {
    console.error('Error handling file encoding:', error)
    
    // Final fallback to default text() method
    return await file.text()
  }
}

/**
 * Score the quality of decoded text for CSV files
 * Returns a score from 0-100, where 100 is perfect
 */
function scoreTextQuality(text: string): number {
  if (!text || text.length === 0) {
    return 0
  }
  
  let score = 100
  
  // Heavy penalty for replacement characters
  const replacementCount = (text.match(/\uFFFD/g) || []).length
  if (replacementCount > 0) {
    score -= replacementCount * 20 // -20 points per replacement character
  }
  
  // Check for typical CSV patterns
  if (!text.includes(',') && !text.includes(';')) {
    score -= 50 // Heavy penalty if no CSV separators
  }
  
  // Check for reasonable character distribution
  const nonPrintableCount = (text.match(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g) || []).length
  const totalChars = text.length
  
  if (totalChars > 0) {
    const nonPrintableRatio = nonPrintableCount / totalChars
    if (nonPrintableRatio > 0.1) {
      score -= 30 // Penalty for too many non-printable characters
    }
  }
  
  // Bonus for common CSV headers
  const commonHeaders = ['Date', 'Montant', 'Libellé', 'Solde', 'Description', 'Amount', 'Date de valeur']
  const hasCommonHeaders = commonHeaders.some(header => 
    text.toLowerCase().includes(header.toLowerCase())
  )
  if (hasCommonHeaders) {
    score += 15 // Bonus for recognizable headers
  }
  
  // Bonus for French characters (common in French banking)
  const frenchChars = (text.match(/[éèêëàâäôöùûüç]/gi) || []).length
  if (frenchChars > 0) {
    score += 10 // Bonus for French characters
  }
  
  // Bonus for common French banking terms
  const frenchBankingTerms = ['virement', 'paiement', 'carte', 'compte', 'banque', 'crédit', 'débit']
  const hasBankingTerms = frenchBankingTerms.some(term => 
    text.toLowerCase().includes(term)
  )
  if (hasBankingTerms) {
    score += 5 // Bonus for French banking terms
  }
  
  // Penalty for too many question marks (often indicate encoding issues)
  const questionMarks = (text.match(/\?/g) || []).length
  if (questionMarks > totalChars * 0.05) { // More than 5% question marks
    score -= 20
  }
  
  return Math.max(0, Math.min(100, score))
}
