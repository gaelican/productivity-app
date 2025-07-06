import { deviceTierDetector } from '../device/DeviceTierDetector';

interface ActiveAnimation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  startTime: number;
  duration: number;
}

class AnimationBudgetManager {
  private static instance: AnimationBudgetManager;
  private activeAnimations = new Map<string, ActiveAnimation>();
  private animationQueue: Array<() => void> = [];

  private constructor() {
    // Cleanup expired animations periodically
    setInterval(() => this.cleanupExpiredAnimations(), 1000);
  }

  static getInstance(): AnimationBudgetManager {
    if (!AnimationBudgetManager.instance) {
      AnimationBudgetManager.instance = new AnimationBudgetManager();
    }
    return AnimationBudgetManager.instance;
  }

  canAnimate(priority: 'high' | 'medium' | 'low' = 'medium'): boolean {
    const budget = deviceTierDetector.getAnimationBudget();
    
    // No animations allowed
    if (budget.maxConcurrent === 0) {
      return false;
    }

    // Check current active animations
    const activeCount = this.activeAnimations.size;
    
    // Under budget, allow animation
    if (activeCount < budget.maxConcurrent) {
      return true;
    }

    // At budget limit, only allow high priority
    if (priority === 'high') {
      // Try to preempt a lower priority animation
      for (const [id, animation] of this.activeAnimations) {
        if (animation.priority === 'low') {
          this.cancelAnimation(id);
          return true;
        }
      }
    }

    return false;
  }

  registerAnimation(
    id: string,
    duration: number,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): boolean {
    if (!this.canAnimate(priority)) {
      return false;
    }

    this.activeAnimations.set(id, {
      id,
      priority,
      startTime: Date.now(),
      duration,
    });

    // Schedule cleanup
    setTimeout(() => {
      this.unregisterAnimation(id);
    }, duration);

    return true;
  }

  unregisterAnimation(id: string): void {
    this.activeAnimations.delete(id);
    
    // Process queued animations if any
    if (this.animationQueue.length > 0 && this.canAnimate()) {
      const nextAnimation = this.animationQueue.shift();
      nextAnimation?.();
    }
  }

  cancelAnimation(id: string): void {
    this.activeAnimations.delete(id);
  }

  queueAnimation(animationFn: () => void): void {
    this.animationQueue.push(animationFn);
    
    // Try to run immediately if budget allows
    if (this.canAnimate()) {
      const animation = this.animationQueue.shift();
      animation?.();
    }
  }

  private cleanupExpiredAnimations(): void {
    const now = Date.now();
    
    for (const [id, animation] of this.activeAnimations) {
      if (now - animation.startTime > animation.duration) {
        this.activeAnimations.delete(id);
      }
    }
  }

  getActiveCount(): number {
    return this.activeAnimations.size;
  }

  getBudgetInfo(): {
    active: number;
    max: number;
    queued: number;
    canAnimate: boolean;
  } {
    const budget = deviceTierDetector.getAnimationBudget();
    
    return {
      active: this.activeAnimations.size,
      max: budget.maxConcurrent,
      queued: this.animationQueue.length,
      canAnimate: this.canAnimate(),
    };
  }

  reset(): void {
    this.activeAnimations.clear();
    this.animationQueue = [];
  }
}

// Export singleton instance
export const animationBudget = AnimationBudgetManager.getInstance();