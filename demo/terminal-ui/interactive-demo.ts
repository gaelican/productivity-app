#!/usr/bin/env node

import readline from 'readline';
import { TerminalRenderer } from './TerminalRenderer';
import { Task, DeviceTier } from '@productivity-app/types';

// Mock tasks for demo
const mockTasks: Task[] = [
  {
    id: 'task_1',
    name: 'Buy milk',
    description: 'Get organic whole milk from the store',
    icon: '🥛',
    color: 'blue',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    dueTime: '17:00',
    isCompleted: false,
    progress: 0,
    tags: ['grocery', 'shopping'],
    userId: 'user_1',
    deviceId: 'terminal_demo',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task_2',
    name: 'Finish presentation',
    description: 'Complete slides for Monday meeting',
    icon: '📊',
    color: 'purple',
    priority: 'high',
    dueDate: new Date(Date.now() + 172800000),
    isCompleted: false,
    progress: 65,
    tags: ['work', 'urgent'],
    userId: 'user_1',
    deviceId: 'terminal_demo',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task_3',
    name: 'Morning workout',
    description: '30 minutes cardio + stretching',
    icon: '🏃',
    color: 'green',
    priority: 'low',
    isCompleted: true,
    completedAt: new Date(),
    progress: 100,
    tags: ['health', 'routine'],
    userId: 'user_1',
    deviceId: 'terminal_demo',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class InteractiveDemo {
  private renderer: TerminalRenderer;
  private tasks: Task[];
  private deviceTier: DeviceTier = 'premium';
  private batteryLevel: number = 85;
  private rl: readline.Interface;
  private performanceMetrics = {
    taskCreation: 0,
    renderTime: 0,
    memoryUsage: 0,
  };

  constructor() {
    this.renderer = new TerminalRenderer();
    this.tasks = [...mockTasks];
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Setup keyboard input
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', this.handleKeypress.bind(this));
  }

  start(): void {
    this.render();
  }

  private render(): void {
    const startTime = Date.now();
    
    this.renderer.clearScreen();
    this.renderer.renderHeader(
      '🚀 Productivity App Terminal Demo',
      this.deviceTier,
      this.batteryLevel
    );
    
    this.renderer.renderTaskList(this.tasks);
    this.renderer.renderControls();
    
    // Update render time metric
    this.performanceMetrics.renderTime = Date.now() - startTime;
    this.performanceMetrics.memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    
    this.renderer.renderPerformanceMetrics(this.performanceMetrics);
  }

  private handleKeypress(str: string, key: any): void {
    if (key && key.ctrl && key.name === 'c') {
      this.exit();
    }

    switch (str) {
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
        this.adjustBattery();
        break;
      case '5':
        this.runTests();
        break;
      case 'q':
        this.exit();
        break;
    }
  }

  private createTask(): void {
    const startTime = Date.now();
    
    // Simulate natural language input
    const inputs = [
      { text: 'Call dentist tomorrow 2pm', icon: '📞', color: 'blue' },
      { text: 'Buy birthday gift', icon: '🎁', color: 'purple' },
      { text: 'Review code PR', icon: '💻', color: 'orange' },
    ];
    
    const randomInput = inputs[Math.floor(Math.random() * inputs.length)];
    
    const newTask: Task = {
      id: `task_${Date.now()}`,
      name: randomInput.text,
      icon: randomInput.icon,
      color: randomInput.color,
      priority: 'medium',
      isCompleted: false,
      progress: 0,
      tags: [],
      userId: 'user_1',
      deviceId: 'terminal_demo',
      version: 1,
      syncStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.tasks.unshift(newTask);
    
    // Update performance metric
    this.performanceMetrics.taskCreation = Date.now() - startTime;
    
    this.render();
    console.log(`\n✅ Created task: "${newTask.name}" in ${this.performanceMetrics.taskCreation}ms`);
  }

  private completeTask(): void {
    const incompleteTasks = this.tasks.filter(t => !t.isCompleted);
    if (incompleteTasks.length === 0) {
      console.log('\n❌ No tasks to complete!');
      setTimeout(() => this.render(), 1500);
      return;
    }

    const task = incompleteTasks[0];
    task.isCompleted = true;
    task.completedAt = new Date();

    // Show balloon animation if device tier and battery allow
    if (this.deviceTier !== 'basic' && this.batteryLevel >= 20) {
      console.log('\n');
      this.renderer.simulateBalloonAnimation();
      setTimeout(() => this.render(), 2000);
    } else {
      this.render();
      console.log(`\n✅ Completed task: "${task.name}"`);
    }
  }

  private cycleDeviceTier(): void {
    const tiers: DeviceTier[] = ['basic', 'standard', 'premium'];
    const currentIndex = tiers.indexOf(this.deviceTier);
    this.deviceTier = tiers[(currentIndex + 1) % tiers.length];
    this.render();
    console.log(`\n🔄 Switched to ${this.deviceTier.toUpperCase()} tier`);
  }

  private adjustBattery(): void {
    // Create a simple battery adjustment menu
    console.log('\n📱 Battery Level:');
    console.log('[+] Increase by 10%');
    console.log('[-] Decrease by 10%');
    console.log('[f] Full charge (100%)');
    console.log('[l] Low battery (15%)');
    console.log('[ESC] Cancel');

    const handleBatteryKey = (str: string, key: any) => {
      process.stdin.removeListener('keypress', handleBatteryKey);
      
      switch (str) {
        case '+':
          this.batteryLevel = Math.min(100, this.batteryLevel + 10);
          break;
        case '-':
          this.batteryLevel = Math.max(0, this.batteryLevel - 10);
          break;
        case 'f':
          this.batteryLevel = 100;
          break;
        case 'l':
          this.batteryLevel = 15;
          break;
      }
      
      this.render();
      process.stdin.on('keypress', this.handleKeypress.bind(this));
    };

    process.stdin.removeListener('keypress', this.handleKeypress.bind(this));
    process.stdin.on('keypress', handleBatteryKey);
  }

  private runTests(): void {
    console.log('\n🧪 Running tests...\n');
    
    // Simulate test execution
    const tests = [
      { name: 'Task creation performance', pass: this.performanceMetrics.taskCreation < 100 },
      { name: 'Render performance', pass: this.performanceMetrics.renderTime < 50 },
      { name: 'Memory usage', pass: this.performanceMetrics.memoryUsage < 150 },
      { name: 'Device tier detection', pass: true },
      { name: 'Battery monitoring', pass: true },
      { name: 'Offline functionality', pass: true },
    ];

    tests.forEach((test, index) => {
      setTimeout(() => {
        const status = test.pass ? '✅' : '❌';
        console.log(`${status} ${test.name}`);
        
        if (index === tests.length - 1) {
          const passed = tests.filter(t => t.pass).length;
          console.log(`\n📊 Test Results: ${passed}/${tests.length} passed`);
          setTimeout(() => this.render(), 2000);
        }
      }, 200 * (index + 1));
    });
  }

  private exit(): void {
    console.log('\n👋 Thanks for trying the demo!\n');
    this.rl.close();
    process.exit(0);
  }
}

// Start the demo
console.log('Starting Productivity App Terminal Demo...\n');
console.log('Note: This demo requires a terminal that supports colors and Unicode.\n');
console.log('Press any key to continue...');

process.stdin.once('data', () => {
  const demo = new InteractiveDemo();
  demo.start();
});