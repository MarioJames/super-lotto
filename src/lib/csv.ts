/**
 * CSV parsing utility for the Lottery Agent system
 * Parses participant data from CSV files
 *
 * Requirements: 2.1, 2.5
 */

import Papa from 'papaparse';
import { Participant } from '@/types';

/**
 * Result type for CSV parsing
 */
export type ParseCSVResult =
  | { success: true; participants: Participant[] }
  | { success: false; error: string };

/**
 * Generate a unique ID for a participant
 */
function generateId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse CSV content and extract participant data
 *
 * @param csvContent - Raw CSV string content
 * @returns ParseCSVResult with participants array or error message
 */
export function parseCSV(csvContent: string): ParseCSVResult {
  // Check for empty content
  if (!csvContent || csvContent.trim() === '') {
    return {
      success: false,
      error: 'CSV content is empty. Please provide a valid CSV file.',
    };
  }

  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  // Check for parsing errors
  if (result.errors.length > 0) {
    const errorMessages = result.errors
      .map((e) => e.message)
      .join('; ');
    return {
      success: false,
      error: `CSV parsing error: ${errorMessages}`,
    };
  }

  // Check if we have any data rows
  if (result.data.length === 0) {
    return {
      success: false,
      error: 'CSV file contains no data rows.',
    };
  }

  // Check for required 'name' column
  const headers = result.meta.fields || [];
  if (!headers.includes('name')) {
    return {
      success: false,
      error: 'CSV file must contain a "name" column.',
    };
  }

  // Transform parsed data to Participant objects
  const participants: Participant[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const name = row['name']?.trim();

    // Skip rows with empty names
    if (!name) {
      continue;
    }

    const participant: Participant = {
      id: generateId(),
      name,
    };

    // Add optional department if present
    if (row['department']?.trim()) {
      participant.department = row['department'].trim();
    }

    // Add any other columns as metadata
    const metadata: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key !== 'name' && key !== 'department' && value?.trim()) {
        metadata[key] = value.trim();
      }
    }
    if (Object.keys(metadata).length > 0) {
      participant.metadata = metadata;
    }

    participants.push(participant);
  }

  // Check if we have any valid participants
  if (participants.length === 0) {
    return {
      success: false,
      error: 'No valid participants found. Ensure the "name" column has values.',
    };
  }

  return {
    success: true,
    participants,
  };
}
