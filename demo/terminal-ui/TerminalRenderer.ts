import chalk from 'chalk';
import boxen from 'boxen';
import { Task, DeviceTier } from '@productivity-app/types';

interface TerminalTheme {
  primary: chalk.Chalk;
  secondary: chalk.Chalk;
  success: chalk.Chalk;
  warning: chalk.Chalk;
  error: chalk.Chalk;
  muted: chalk.Chalk;
  gradient: (text: string, from: string, to: string) => string;
}

export class TerminalRenderer {
  private theme: TerminalTheme = {
    primary: chalk.blue,
    secondary: chalk.cyan,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    muted: chalk.gray,
    gradient: (text: string, from: string, to: string) => {
      // Simulate gradient with color transition
      return chalk.hex(from)(text.slice(0, text.length / 2)) + 
             chalk.hex(to)(text.slice(text.length / 2));
    }
  };

  clearScreen(): void {
    console.clear();
    process.stdout.write('\x1B[2J\x1B[0f');
  }

  renderHeader(title: string, deviceTier: DeviceTier, batteryLevel: number): void {
    const headerContent = `
${chalk.bold.white(title)}
${chalk.dim('─'.repeat(50))}
Device Tier: ${this.getDeviceTierBadge(deviceTier)}
Battery: ${this.getBatteryIndicator(batteryLevel)}
Animations: ${this.getAnimationStatus(deviceTier, batteryLevel)}
    `.trim();

    console.log(boxen(headerContent, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }));
  }

  renderTaskCard(task: Task, index: number): void {
    const gradientColors = this.getGradientColors(task.color);
    const statusIcon = task.isCompleted ? '✓' : '○';
    const priorityBadge = this.getPriorityBadge(task.priority);
    
    // Create gradient effect using Unicode blocks
    const gradientBar = this.createGradientBar(gradientColors.from, gradientColors.to);
    
    const cardContent = `
${gradientBar}
${chalk.bold.white(`${task.icon} ${task.name}`)} ${chalk.dim(statusIcon)}
${task.description ? chalk.dim(task.description) : ''}
${this.renderMetadata(task, priorityBadge)}
    `.trim();

    const boxOptions = {
      padding: { top: 0, right: 1, bottom: 0, left: 1 },
      margin: { top: 0, right: 0, bottom: 1, left: 2 },
      borderStyle: 'round' as const,
      borderColor: task.isCompleted ? 'gray' : 'white',
      dimBorder: task.isCompleted,
    };

    console.log(boxen(cardContent, boxOptions));
  }

  renderTaskList(tasks: Task[]): void {
    console.log(chalk.bold('\n📋 Tasks:\n'));
    tasks.forEach((task, index) => this.renderTaskCard(task, index));
  }

  renderControls(): void {
    const controls = `
${chalk.bold('Controls:')}
${chalk.dim('─'.repeat(30))}
${chalk.yellow('[1]')} Create Task
${chalk.yellow('[2]')} Complete Task
${chalk.yellow('[3]')} Change Device Tier
${chalk.yellow('[4]')} Adjust Battery
${chalk.yellow('[5]')} Run Tests
${chalk.yellow('[q]')} Quit
    `.trim();

    console.log(boxen(controls, {
      padding: 1,
      margin: { top: 1, right: 0, bottom: 0, left: 0 },
      borderStyle: 'single',
      borderColor: 'yellow'
    }));
  }

  renderPerformanceMetrics(metrics: {
    taskCreation?: number;
    renderTime?: number;
    memoryUsage?: number;
  }): void {
    const metricsContent = `
${chalk.bold('Performance Metrics:')}
${chalk.dim('─'.repeat(30))}
Task Creation: ${this.getPerformanceIndicator(metrics.taskCreation || 0, 100)} ${metrics.taskCreation || 0}ms
Render Time: ${this.getPerformanceIndicator(metrics.renderTime || 0, 50)} ${metrics.renderTime || 0}ms
Memory Usage: ${metrics.memoryUsage || 0} MB
    `.trim();

    console.log(boxen(metricsContent, {
      padding: 1,
      margin: { top: 1, right: 0, bottom: 0, left: 0 },
      borderStyle: 'single',
      borderColor: 'green'
    }));
  }

  // Helper methods
  private getDeviceTierBadge(tier: DeviceTier): string {
    const badges = {
      basic: chalk.bgGray.white(' BASIC '),
      standard: chalk.bgBlue.white(' STANDARD '),
      premium: chalk.bgMagenta.white(' PREMIUM ')
    };
    return badges[tier];
  }

  private getBatteryIndicator(level: number): string {
    const blocks = Math.floor(level / 10);
    const color = level < 20 ? 'red' : level < 50 ? 'yellow' : 'green';
    const battery = chalk[color]('█'.repeat(blocks)) + chalk.gray('░'.repeat(10 - blocks));
    return `${battery} ${level}%`;
  }

  private getAnimationStatus(tier: DeviceTier, battery: number): string {
    if (battery < 20) return chalk.red('❌ Disabled (Low Battery)');
    if (tier === 'basic') return chalk.yellow('❌ Disabled (Basic Tier)');
    if (tier === 'standard') return chalk.blue('⚡ Limited');
    return chalk.green('✨ Full');
  }

  private getGradientColors(colorId: string): { from: string; to: string } {
    const gradients: Record<string, { from: string; to: string }> = {
      blue: { from: '#3B82F6', to: '#1E40AF' },
      green: { from: '#10B981', to: '#059669' },
      red: { from: '#EF4444', to: '#DC2626' },
      purple: { from: '#A855F7', to: '#7C3AED' },
      orange: { from: '#FB923C', to: '#EA580C' },
    };
    return gradients[colorId] || gradients.blue;
  }

  private createGradientBar(from: string, to: string): string {
    // Create a gradient effect using Unicode block characters
    const blocks = ['█', '▓', '▒', '░'];
    const gradientChars = blocks.map((block, i) => {
      const ratio = i / (blocks.length - 1);
      const color = this.interpolateColor(from, to, ratio);
      return chalk.hex(color)(block.repeat(12));
    }).join('');
    
    return gradientChars;
  }

  private interpolateColor(from: string, to: string, ratio: number): string {
    const fromRgb = this.hexToRgb(from);
    const toRgb = this.hexToRgb(to);
    
    const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * ratio);
    const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * ratio);
    const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private getPriorityBadge(priority: string): string {
    const badges = {
      low: chalk.gray('[LOW]'),
      medium: '',
      high: chalk.yellow('[HIGH]'),
      urgent: chalk.red('[URGENT]')
    };
    return badges[priority as keyof typeof badges] || '';
  }

  private renderMetadata(task: Task, priorityBadge: string): string {
    const parts = [];
    
    if (priorityBadge) parts.push(priorityBadge);
    
    if (task.dueDate) {
      const dueStr = this.formatDueDate(task.dueDate, task.dueTime);
      parts.push(chalk.dim(`📅 ${dueStr}`));
    }
    
    if (task.tags && task.tags.length > 0) {
      const tagStr = task.tags.map(t => chalk.cyan(`#${t}`)).join(' ');
      parts.push(tagStr);
    }
    
    return parts.join(' ');
  }

  private formatDueDate(date: Date, time?: string): string {
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let dateStr = '';
    if (diffDays === 0) dateStr = 'Today';
    else if (diffDays === 1) dateStr = 'Tomorrow';
    else if (diffDays < 0) dateStr = `${Math.abs(diffDays)} days ago`;
    else dateStr = `In ${diffDays} days`;

    if (time) dateStr += ` at ${time}`;
    return dateStr;
  }

  private getPerformanceIndicator(value: number, threshold: number): string {
    if (value <= threshold) return chalk.green('✓');
    if (value <= threshold * 1.5) return chalk.yellow('⚠');
    return chalk.red('✗');
  }

  // Animation simulation for terminal
  simulateBalloonAnimation(): void {
    const frames = [
      '   ○   ',
      '  (○)  ',
      ' ((○)) ',
      '((🎈))',
      ' (🎈) ',
      '  💥  ',
      '  ✨  ',
      '   ✓   '
    ];

    let i = 0;
    const interval = setInterval(() => {
      process.stdout.write('\r' + frames[i]);
      i++;
      if (i >= frames.length) {
        clearInterval(interval);
        console.log('\n' + chalk.green('Task completed!'));
      }
    }, 200);
  }
}