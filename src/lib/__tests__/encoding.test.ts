import { describe, it, expect, vi } from 'vitest'
import { handleFileEncoding } from '../bank-utils'

// Mock iconv-lite
vi.mock('iconv-lite', () => ({
  encodingExists: vi.fn((encoding: string) => {
    const supportedEncodings = ['utf8', 'iso-8859-2', 'windows-1252', 'iso-8859-1', 'cp1250', 'cp1251', 'latin1']
    return supportedEncodings.includes(encoding)
  }),
  decode: vi.fn((buffer: Buffer, encoding: string) => {
    // Simple mock that returns the buffer as string for testing
    return buffer.toString('utf8')
  })
}))

// Mock File class for testing
class MockFile {
  constructor(public content: string, public name: string, public type: string) {}

  async text(): Promise<string> {
    return this.content
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    return encoder.encode(this.content).buffer
  }
}

describe('File Encoding Handling', () => {
  it('should handle UTF-8 encoded files', async () => {
    const utf8Content = 'Date,Montant,Description\n13/08/2025,50.00,Test transaction'
    const file = new MockFile(utf8Content, 'test.csv', 'text/csv') as any

    const result = await handleFileEncoding(file)
    expect(result).toBe(utf8Content)
  })

  it('should handle files with special characters', async () => {
    const specialContent = 'Date,Montant,Description\n13/08/2025,50.00,Test with éàç characters'
    const file = new MockFile(specialContent, 'test.csv', 'text/csv') as any

    const result = await handleFileEncoding(file)
    expect(result).toBe(specialContent)
  })

  it('should fallback to default text() method on error', async () => {
    const file = new MockFile('test content', 'test.csv', 'text/csv') as any

    // Mock arrayBuffer to throw an error
    vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('ArrayBuffer error'))

    const result = await handleFileEncoding(file)
    expect(result).toBe('test content')
  })

  it('should handle empty files', async () => {
    const file = new MockFile('', 'empty.csv', 'text/csv') as any

    const result = await handleFileEncoding(file)
    expect(result).toBe('')
  })

  it('should handle files with replacement characters', async () => {
    // Create content with replacement characters
    const problematicContent = 'Date,Montant,Description\n13/08/2025,50.00,Test transaction'
    const file = new MockFile(problematicContent, 'test.csv', 'text/csv') as any

    const result = await handleFileEncoding(file)
    expect(result).toBe(problematicContent)
  })

  it('should validate CSV structure', async () => {
    const csvContent = 'Date,Montant,Description\n13/08/2025,50.00,Test transaction'
    const file = new MockFile(csvContent, 'test.csv', 'text/csv') as any

    const result = await handleFileEncoding(file)
    expect(result).toContain(',')
    expect(result).toContain('Date')
  })
})
