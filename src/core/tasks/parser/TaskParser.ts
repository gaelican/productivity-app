import * as chrono from 'chrono-node';
import { Priority } from '../../../packages/types';

export interface ParsedTask {
  title: string;
  dueDate?: Date;
  dueTime?: string;
  priority: Priority;
  suggestedIcon?: string;
  originalInput: string;
  parsedElements: {
    dateText?: string;
    timeText?: string;
    priorityText?: string;
  };
}

export class TaskParser {
  private chronoParser: chrono.Chrono;

  constructor() {
    // Create a custom chrono instance for more control
    this.chronoParser = new chrono.Chrono();
  }

  /**
   * Parse natural language input into structured task data
   * @param input - Natural language task description (e.g., "Buy milk tomorrow 5pm")
   * @returns ParsedTask object with extracted information
   */
  parse(input: string): ParsedTask {
    const result: ParsedTask = {
      title: input,
      priority: 'medium',
      originalInput: input,
      parsedElements: {},
    };

    // Step 1: Extract date and time information
    const dateTimeResult = this.extractDateTime(input);
    if (dateTimeResult) {
      result.dueDate = dateTimeResult.date;
      result.dueTime = dateTimeResult.timeString;
      result.parsedElements.dateText = dateTimeResult.dateText;
      result.parsedElements.timeText = dateTimeResult.timeText;
      result.title = dateTimeResult.remainingText;
    }

    // Step 2: Extract priority keywords
    const priorityResult = this.extractPriority(result.title);
    result.priority = priorityResult.priority;
    result.parsedElements.priorityText = priorityResult.priorityText;
    result.title = priorityResult.remainingText;

    // Step 3: Suggest icon based on keywords
    result.suggestedIcon = this.suggestIcon(result.title);

    // Clean up the title - remove extra spaces
    result.title = result.title.trim().replace(/\s+/g, ' ');

    return result;
  }

  /**
   * Extract date and time from the input text
   */
  private extractDateTime(input: string): {
    date: Date;
    timeString?: string;
    dateText: string;
    timeText?: string;
    remainingText: string;
  } | null {
    // Parse the input with chrono
    const parseResult = this.chronoParser.parse(input);
    
    if (parseResult.length === 0) {
      return null;
    }

    const chronoResult = parseResult[0];
    const date = chronoResult.start.date();
    
    // Extract the matched text
    const dateText = chronoResult.text;
    let remainingText = input.replace(dateText, '').trim();
    
    // Check if time was explicitly mentioned
    let timeString: string | undefined;
    let timeText: string | undefined;
    
    if (chronoResult.start.isCertain('hour')) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Try to find the time text in the original input
      const timePatterns = [
        /\b\d{1,2}:\d{2}\s?(am|pm)?\b/i,
        /\b\d{1,2}\s?(am|pm)\b/i,
        /\b(morning|afternoon|evening|night)\b/i,
      ];
      
      for (const pattern of timePatterns) {
        const match = dateText.match(pattern);
        if (match) {
          timeText = match[0];
          break;
        }
      }
    }
    
    return {
      date,
      timeString,
      dateText,
      timeText,
      remainingText,
    };
  }

  /**
   * Extract priority keywords from the text
   */
  private extractPriority(input: string): {
    priority: Priority;
    priorityText?: string;
    remainingText: string;
  } {
    const priorityPatterns = [
      { 
        pattern: /\b(urgent|urgently|asap|immediately|critical|emergency)\b/i,
        priority: 'urgent' as Priority,
      },
      {
        pattern: /\b(high priority|important|high)\b/i,
        priority: 'high' as Priority,
      },
      {
        pattern: /\b(low priority|low|minor|trivial)\b/i,
        priority: 'low' as Priority,
      },
    ];

    for (const { pattern, priority } of priorityPatterns) {
      const match = input.match(pattern);
      if (match) {
        const priorityText = match[0];
        const remainingText = input.replace(priorityText, '').trim();
        return {
          priority,
          priorityText,
          remainingText,
        };
      }
    }

    return {
      priority: 'medium',
      remainingText: input,
    };
  }

  /**
   * Suggest an icon based on task keywords
   */
  private suggestIcon(input: string): string {
    const lowerInput = input.toLowerCase();
    
    const iconMappings = [
      // Shopping & Food
      { keywords: ['buy', 'shop', 'grocery', 'groceries', 'store'], icon: '🛒' },
      { keywords: ['milk', 'bread', 'eggs', 'food'], icon: '🥛' },
      { keywords: ['coffee', 'tea', 'drink'], icon: '☕' },
      { keywords: ['lunch', 'dinner', 'breakfast', 'meal', 'eat'], icon: '🍽️' },
      { keywords: ['cook', 'cooking', 'recipe'], icon: '👨‍🍳' },
      
      // Work & Productivity
      { keywords: ['meeting', 'meet', 'conference', 'call'], icon: '👥' },
      { keywords: ['email', 'mail', 'send', 'reply'], icon: '📧' },
      { keywords: ['write', 'document', 'report', 'draft'], icon: '📝' },
      { keywords: ['project', 'task', 'complete'], icon: '📋' },
      { keywords: ['deadline', 'due', 'submit'], icon: '⏰' },
      { keywords: ['code', 'program', 'develop', 'debug'], icon: '💻' },
      
      // Health & Fitness
      { keywords: ['workout', 'exercise', 'gym', 'fitness'], icon: '💪' },
      { keywords: ['run', 'jog', 'running'], icon: '🏃' },
      { keywords: ['doctor', 'appointment', 'medical', 'health'], icon: '👨‍⚕️' },
      { keywords: ['medicine', 'pill', 'medication'], icon: '💊' },
      
      // Personal & Home
      { keywords: ['clean', 'cleaning', 'laundry', 'wash'], icon: '🧹' },
      { keywords: ['pay', 'payment', 'bill', 'invoice'], icon: '💳' },
      { keywords: ['call', 'phone', 'contact'], icon: '📞' },
      { keywords: ['birthday', 'party', 'celebration'], icon: '🎉' },
      { keywords: ['gift', 'present'], icon: '🎁' },
      { keywords: ['book', 'read', 'reading'], icon: '📚' },
      { keywords: ['study', 'learn', 'homework'], icon: '📖' },
      
      // Transportation
      { keywords: ['car', 'drive', 'driving', 'vehicle'], icon: '🚗' },
      { keywords: ['flight', 'fly', 'airport', 'travel'], icon: '✈️' },
      { keywords: ['train', 'bus', 'transit'], icon: '🚆' },
    ];

    // Check each mapping
    for (const mapping of iconMappings) {
      for (const keyword of mapping.keywords) {
        if (lowerInput.includes(keyword)) {
          return mapping.icon;
        }
      }
    }

    // Default icon
    return '📌';
  }
}