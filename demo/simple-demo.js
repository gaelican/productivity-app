#!/usr/bin/env node

const chalk = require('chalk');
const boxen = require('boxen');

// Mock data
const mockTasks = [
  {
    id: 'task_1',
    name: 'Buy milk',
    description: 'Get organic whole milk from the store',
    icon: '🥛',
    color: 'blue',
    priority: 'medium',
    dueDate: 'Tomorrow at 17:00',
    isCompleted: false,
    tags: ['grocery', 'shopping'],
  },
  {
    id: 'task_2',
    name: 'Finish presentation',
    description: 'Complete slides for Monday meeting',
    icon: '📊',
    color: 'purple',
    priority: 'high',
    dueDate: 'In 2 days',
    isCompleted: false,
    tags: ['work', 'urgent'],
  },
  {
    id: 'task_3',
    name: 'Morning workout',
    description: '30 minutes cardio + stretching',
    icon: '🏃',
    color: 'green',
    priority: 'low',
    isCompleted: true,
    tags: ['health', 'routine'],
  },
];

class SimpleDemo {
  constructor() {
    this.tasks = [...mockTasks];
    this.deviceTier = 'premium';
    this.batteryLevel = 85;
    this.performanceMetrics = {
      taskCreation: 85,
      renderTime: 35,
      memoryUsage: 120,
    };
  }

  start() {
    console.clear();
    this.render();
    this.setupInput();
  }

  render() {
    console.clear();
    
    // Header
    const headerContent = `
${chalk.bold.white('🚀 Productivity App Terminal Demo')}
${chalk.dim('─'.repeat(50))}
Device Tier: ${this.getDeviceTierBadge()}
Battery: ${this.getBatteryIndicator()}
Animations: ${this.getAnimationStatus()}
    `.trim();

    console.log(boxen(headerContent, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }));

    // Tasks
    console.log(chalk.bold('\n📋 Tasks:\n'));
    this.tasks.forEach(task => this.renderTaskCard(task));

    // Controls
    const controls = `
${chalk.bold('Controls:')}
${chalk.dim('─'.repeat(30))}
${chalk.yellow('[1]')} Create Task
${chalk.yellow('[2]')} Complete Task
${chalk.yellow('[3]')} Change Device Tier
${chalk.yellow('[4]')} Adjust Battery (-10%)
${chalk.yellow('[5]')} Adjust Battery (+10%)
${chalk.yellow('[6]')} Run Performance Test
${chalk.yellow('[q]')} Quit
    `.trim();

    console.log(boxen(controls, {
      padding: 1,
      margin: { top: 1 },
      borderStyle: 'single',
      borderColor: 'yellow'
    }));

    // Performance Metrics
    this.renderPerformanceMetrics();
  }

  renderTaskCard(task) {
    const gradientBar = this.createGradientBar(task.color);
    const statusIcon = task.isCompleted ? '✓' : '○';
    const priorityBadge = this.getPriorityBadge(task.priority);
    
    const cardContent = `
${gradientBar}
${chalk.bold.white(`${task.icon} ${task.name}`)} ${chalk.dim(statusIcon)}
${task.description ? chalk.dim(task.description) : ''}
${this.renderMetadata(task, priorityBadge)}
    `.trim();

    const boxOptions = {
      padding: { top: 0, right: 1, bottom: 0, left: 1 },
      margin: { top: 0, right: 0, bottom: 1, left: 2 },
      borderStyle: 'round',
      borderColor: task.isCompleted ? 'gray' : 'white',
      dimBorder: task.isCompleted,
    };

    console.log(boxen(cardContent, boxOptions));
  }

  renderPerformanceMetrics() {
    const metricsContent = `
${chalk.bold('Performance Metrics:')}
${chalk.dim('─'.repeat(30))}
Task Creation: ${this.getPerformanceIndicator(this.performanceMetrics.taskCreation, 100)} ${this.performanceMetrics.taskCreation}ms
Render Time: ${this.getPerformanceIndicator(this.performanceMetrics.renderTime, 50)} ${this.performanceMetrics.renderTime}ms
Memory Usage: ${this.performanceMetrics.memoryUsage} MB
    `.trim();

    console.log(boxen(metricsContent, {
      padding: 1,
      margin: { top: 1 },
      borderStyle: 'single',
      borderColor: 'green'
    }));
  }

  setupInput() {
    console.log(chalk.gray('\nPress a key to interact...'));
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (key) => {
      switch(key) {
        case '1':
          this.createTask();
          break;
        case '2':
          this.completeTask();
          break;
        case '3':
          this.cycleDeviceTier();
          break;
        case '4':
          this.adjustBattery(-10);
          break;
        case '5':
          this.adjustBattery(10);
          break;
        case '6':
          this.runPerformanceTest();
          break;
        case 'q':
        case '\u0003': // Ctrl+C
          this.exit();
          break;
      }
    });
  }

  createTask() {
    const newTask = {
      id: `task_${Date.now()}`,
      name: 'Call dentist',
      description: 'Schedule appointment for next week',
      icon: '📞',
      color: 'orange',
      priority: 'medium',
      dueDate: 'Tomorrow at 14:00',
      isCompleted: false,
      tags: ['personal', 'health'],
    };
    
    this.tasks.unshift(newTask);
    this.performanceMetrics.taskCreation = Math.floor(Math.random() * 50) + 50;
    
    this.render();
    console.log(chalk.green(`\n✅ Created task: "${newTask.name}" in ${this.performanceMetrics.taskCreation}ms`));
    console.log(chalk.gray('Press a key to continue...'));
  }

  completeTask() {
    const incompleteTasks = this.tasks.filter(t => !t.isCompleted);
    if (incompleteTasks.length === 0) {
      this.render();
      console.log(chalk.red('\n❌ No tasks to complete!'));
      console.log(chalk.gray('Press a key to continue...'));
      return;
    }

    const task = incompleteTasks[0];
    task.isCompleted = true;

    if (this.deviceTier !== 'basic' && this.batteryLevel >= 20) {
      this.showBalloonAnimation(() => {
        this.render();
        console.log(chalk.green(`\n✅ Completed task: "${task.name}" with animation!`));
        console.log(chalk.gray('Press a key to continue...'));
      });
    } else {
      this.render();
      console.log(chalk.green(`\n✅ Completed task: "${task.name}"`));
      console.log(chalk.gray('Press a key to continue...'));
    }
  }

  showBalloonAnimation(callback) {
    const frames = ['   ○   ', '  (○)  ', ' ((○)) ', '((🎈))', ' (🎈) ', '  💥  ', '  ✨  ', '   ✓   '];
    let i = 0;
    
    console.log('\n');
    const interval = setInterval(() => {
      process.stdout.write('\r' + frames[i]);
      i++;
      if (i >= frames.length) {
        clearInterval(interval);
        console.log('');
        callback();
      }
    }, 200);
  }

  cycleDeviceTier() {
    const tiers = ['basic', 'standard', 'premium'];
    const currentIndex = tiers.indexOf(this.deviceTier);
    this.deviceTier = tiers[(currentIndex + 1) % tiers.length];
    
    this.render();
    console.log(chalk.blue(`\n🔄 Switched to ${this.deviceTier.toUpperCase()} tier`));
    console.log(chalk.gray('Press a key to continue...'));
  }

  adjustBattery(delta) {
    this.batteryLevel = Math.max(0, Math.min(100, this.batteryLevel + delta));
    
    this.render();
    console.log(chalk.yellow(`\n🔋 Battery adjusted to ${this.batteryLevel}%`));
    console.log(chalk.gray('Press a key to continue...'));
  }

  runPerformanceTest() {
    this.render();
    console.log(chalk.bold('\n🧪 Running Performance Tests...\n'));
    
    const tests = [
      { name: 'Task Creation', target: 100, actual: Math.floor(Math.random() * 50) + 50 },
      { name: 'Render Time', target: 50, actual: Math.floor(Math.random() * 30) + 20 },
      { name: 'Memory Usage', target: 150, actual: Math.floor(Math.random() * 50) + 100 },
    ];

    tests.forEach((test, index) => {
      setTimeout(() => {
        const passed = test.actual <= test.target;
        const status = passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
        console.log(`${test.name}: ${test.actual}ms (target: <${test.target}ms) ${status}`);
        
        if (index === tests.length - 1) {
          console.log(chalk.gray('\nPress a key to continue...'));
        }
      }, (index + 1) * 500);
    });
  }

  exit() {
    console.clear();
    console.log(chalk.bold('\n👋 Thanks for trying the Productivity App demo!\n'));
    process.exit(0);
  }

  // Helper methods
  getDeviceTierBadge() {
    const badges = {
      basic: chalk.bgGray.white(' BASIC '),
      standard: chalk.bgBlue.white(' STANDARD '),
      premium: chalk.bgMagenta.white(' PREMIUM ')
    };
    return badges[this.deviceTier];
  }

  getBatteryIndicator() {
    const blocks = Math.floor(this.batteryLevel / 10);
    const filled = '█'.repeat(blocks);
    const empty = '░'.repeat(10 - blocks);
    const color = this.batteryLevel < 20 ? 'red' : this.batteryLevel < 50 ? 'yellow' : 'green';
    return chalk[color](filled) + chalk.gray(empty) + ` ${this.batteryLevel}%`;
  }

  getAnimationStatus() {
    if (this.batteryLevel < 20) return chalk.red('❌ Disabled (Low Battery)');
    if (this.deviceTier === 'basic') return chalk.yellow('❌ Disabled (Basic Tier)');
    if (this.deviceTier === 'standard') return chalk.blue('⚡ Limited');
    return chalk.green('✨ Full');
  }

  createGradientBar(color) {
    const gradients = {
      blue: chalk.hex('#3B82F6')('█') + chalk.hex('#2563EB')('▓') + chalk.hex('#1D4ED8')('▒') + chalk.hex('#1E40AF')('░'),
      purple: chalk.hex('#A855F7')('█') + chalk.hex('#9333EA')('▓') + chalk.hex('#7E22CE')('▒') + chalk.hex('#7C3AED')('░'),
      green: chalk.hex('#10B981')('█') + chalk.hex('#059669')('▓') + chalk.hex('#047857')('▒') + chalk.hex('#065F46')('░'),
      orange: chalk.hex('#FB923C')('█') + chalk.hex('#F97316')('▓') + chalk.hex('#EA580C')('▒') + chalk.hex('#DC2626')('░'),
    };
    return (gradients[color] || gradients.blue) + chalk.gray('░'.repeat(44));
  }

  getPriorityBadge(priority) {
    const badges = {
      low: chalk.gray('[LOW]'),
      medium: '',
      high: chalk.yellow('[HIGH]'),
      urgent: chalk.red('[URGENT]')
    };
    return badges[priority] || '';
  }

  renderMetadata(task, priorityBadge) {
    const parts = [];
    if (priorityBadge) parts.push(priorityBadge);
    if (task.dueDate) parts.push(chalk.dim(`📅 ${task.dueDate}`));
    if (task.tags && task.tags.length > 0) {
      parts.push(task.tags.map(t => chalk.cyan(`#${t}`)).join(' '));
    }
    return parts.join(' ');
  }

  getPerformanceIndicator(value, threshold) {
    if (value <= threshold) return chalk.green('✓');
    if (value <= threshold * 1.5) return chalk.yellow('⚠');
    return chalk.red('✗');
  }
}

// Start the demo
console.log(chalk.bold('🚀 Starting Productivity App Interactive Demo...\n'));
console.log(chalk.gray('This demo shows the app running in your terminal with visual feedback.\n'));
console.log('Press ENTER to begin...');

process.stdin.once('data', () => {
  const demo = new SimpleDemo();
  demo.start();
});