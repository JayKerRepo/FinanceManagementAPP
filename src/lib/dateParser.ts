/**
 * DateParser
 * 
 * Parses relative date expressions ("today", "yesterday", "last week")
 * and converts them to ISO date strings.
 * 
 * @class DateParser
 */

export class DateParser {
  /**
   * Parse date expression to ISO date string
   * @param expression - Date expression (e.g., "today", "yesterday", "last week")
   * @returns ISO date string (YYYY-MM-DD) or null if invalid
   */
  parse(expression: string): string | null {
    if (!expression) {
      return this.getTodayISO()
    }

    const normalized = expression.toLowerCase().trim()

    // Handle "today"
    if (normalized === 'today' || normalized === 'now') {
      return this.getTodayISO()
    }

    // Handle "yesterday"
    if (normalized === 'yesterday') {
      return this.getYesterdayISO()
    }

    // Handle "tomorrow"
    if (normalized === 'tomorrow') {
      return this.getTomorrowISO()
    }

    // Handle "last week", "last month", etc.
    if (normalized.startsWith('last ')) {
      return this.parseLastExpression(normalized)
    }

    // Handle "this week", "this month", etc.
    if (normalized.startsWith('this ')) {
      return this.parseThisExpression(normalized)
    }

    // Handle ISO date format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized
    }

    // Handle date formats like "MM/DD/YYYY" or "DD/MM/YYYY"
    const dateMatch = normalized.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (dateMatch) {
      const [, month, day, year] = dateMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Default to today if can't parse
    return this.getTodayISO()
  }

  /**
   * Get today's date as ISO string
   * @returns ISO date string
   */
  private getTodayISO(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Get yesterday's date as ISO string
   * @returns ISO date string
   */
  private getYesterdayISO(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }

  /**
   * Get tomorrow's date as ISO string
   * @returns ISO date string
   */
  private getTomorrowISO(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  /**
   * Parse "last X" expressions
   * @param expression - Expression like "last week", "last month"
   * @returns ISO date string
   */
  private parseLastExpression(expression: string): string {
    const date = new Date()

    if (expression.includes('week')) {
      date.setDate(date.getDate() - 7)
    } else if (expression.includes('month')) {
      date.setMonth(date.getMonth() - 1)
    } else if (expression.includes('year')) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (expression.includes('day')) {
      date.setDate(date.getDate() - 1)
    }

    return date.toISOString().split('T')[0]
  }

  /**
   * Parse "this X" expressions (defaults to today)
   * @param expression - Expression like "this week", "this month"
   * @returns ISO date string
   */
  private parseThisExpression(expression: string): string {
    // For "this week/month/year", default to today
    // Could be enhanced to return start of period
    return this.getTodayISO()
  }
}

// Export singleton instance
export const dateParser = new DateParser()



