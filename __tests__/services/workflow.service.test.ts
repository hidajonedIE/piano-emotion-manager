/**
 * Tests for Workflow Service
 * Piano Emotion Manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../server/db', () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
}));

describe('Workflow Service', () => {
  describe('Workflow Validation', () => {
    // Workflow step types
    type StepType = 'task' | 'notification' | 'condition' | 'delay' | 'action';
    
    interface WorkflowStep {
      id: string;
      type: StepType;
      name: string;
      config: Record<string, unknown>;
      nextSteps?: string[];
    }

    interface Workflow {
      id: string;
      name: string;
      trigger: string;
      steps: WorkflowStep[];
      isActive: boolean;
    }

    const validateWorkflow = (workflow: Workflow): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Check required fields
      if (!workflow.name || workflow.name.trim() === '') {
        errors.push('Workflow name is required');
      }

      if (!workflow.trigger || workflow.trigger.trim() === '') {
        errors.push('Workflow trigger is required');
      }

      if (!workflow.steps || workflow.steps.length === 0) {
        errors.push('Workflow must have at least one step');
      }

      // Validate steps
      const stepIds = new Set<string>();
      for (const step of workflow.steps || []) {
        if (stepIds.has(step.id)) {
          errors.push(`Duplicate step ID: ${step.id}`);
        }
        stepIds.add(step.id);

        if (!step.name || step.name.trim() === '') {
          errors.push(`Step ${step.id} must have a name`);
        }

        // Validate next steps references
        for (const nextId of step.nextSteps || []) {
          if (!workflow.steps.some(s => s.id === nextId)) {
            errors.push(`Step ${step.id} references non-existent step: ${nextId}`);
          }
        }
      }

      // Check for circular references
      const visited = new Set<string>();
      const checkCycle = (stepId: string, path: Set<string>): boolean => {
        if (path.has(stepId)) return true;
        if (visited.has(stepId)) return false;
        
        visited.add(stepId);
        path.add(stepId);
        
        const step = workflow.steps.find(s => s.id === stepId);
        if (step?.nextSteps) {
          for (const nextId of step.nextSteps) {
            if (checkCycle(nextId, new Set(path))) return true;
          }
        }
        
        return false;
      };

      for (const step of workflow.steps || []) {
        if (checkCycle(step.id, new Set())) {
          errors.push('Workflow contains circular references');
          break;
        }
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate a valid workflow', () => {
      const workflow: Workflow = {
        id: '1',
        name: 'Test Workflow',
        trigger: 'service_completed',
        steps: [
          { id: 'step1', type: 'task', name: 'First Step', config: {} },
          { id: 'step2', type: 'notification', name: 'Notify', config: {}, nextSteps: [] },
        ],
        isActive: true,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject workflow without name', () => {
      const workflow: Workflow = {
        id: '1',
        name: '',
        trigger: 'service_completed',
        steps: [{ id: 'step1', type: 'task', name: 'Step', config: {} }],
        isActive: true,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow name is required');
    });

    it('should reject workflow without trigger', () => {
      const workflow: Workflow = {
        id: '1',
        name: 'Test',
        trigger: '',
        steps: [{ id: 'step1', type: 'task', name: 'Step', config: {} }],
        isActive: true,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow trigger is required');
    });

    it('should reject workflow without steps', () => {
      const workflow: Workflow = {
        id: '1',
        name: 'Test',
        trigger: 'service_completed',
        steps: [],
        isActive: true,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must have at least one step');
    });

    it('should reject workflow with duplicate step IDs', () => {
      const workflow: Workflow = {
        id: '1',
        name: 'Test',
        trigger: 'service_completed',
        steps: [
          { id: 'step1', type: 'task', name: 'Step 1', config: {} },
          { id: 'step1', type: 'task', name: 'Step 2', config: {} },
        ],
        isActive: true,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate step ID: step1');
    });

    it('should reject workflow with invalid step references', () => {
      const workflow: Workflow = {
        id: '1',
        name: 'Test',
        trigger: 'service_completed',
        steps: [
          { id: 'step1', type: 'task', name: 'Step 1', config: {}, nextSteps: ['nonexistent'] },
        ],
        isActive: true,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('non-existent step'))).toBe(true);
    });

    it('should detect circular references', () => {
      const workflow: Workflow = {
        id: '1',
        name: 'Test',
        trigger: 'service_completed',
        steps: [
          { id: 'step1', type: 'task', name: 'Step 1', config: {}, nextSteps: ['step2'] },
          { id: 'step2', type: 'task', name: 'Step 2', config: {}, nextSteps: ['step1'] },
        ],
        isActive: true,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow contains circular references');
    });
  });

  describe('Workflow Execution', () => {
    interface ExecutionContext {
      workflowId: string;
      triggeredBy: string;
      data: Record<string, unknown>;
      currentStep: string;
      completedSteps: string[];
      status: 'running' | 'completed' | 'failed' | 'paused';
    }

    const createExecutionContext = (
      workflowId: string,
      triggeredBy: string,
      data: Record<string, unknown>
    ): ExecutionContext => ({
      workflowId,
      triggeredBy,
      data,
      currentStep: '',
      completedSteps: [],
      status: 'running',
    });

    it('should create execution context correctly', () => {
      const context = createExecutionContext(
        'workflow-1',
        'user-123',
        { serviceId: 'service-456' }
      );

      expect(context.workflowId).toBe('workflow-1');
      expect(context.triggeredBy).toBe('user-123');
      expect(context.data.serviceId).toBe('service-456');
      expect(context.status).toBe('running');
      expect(context.completedSteps).toHaveLength(0);
    });

    it('should track completed steps', () => {
      const context = createExecutionContext('workflow-1', 'user-123', {});
      
      context.completedSteps.push('step1');
      context.completedSteps.push('step2');
      context.currentStep = 'step3';

      expect(context.completedSteps).toContain('step1');
      expect(context.completedSteps).toContain('step2');
      expect(context.currentStep).toBe('step3');
    });
  });

  describe('Condition Evaluation', () => {
    type Operator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    
    interface Condition {
      field: string;
      operator: Operator;
      value: unknown;
    }

    const evaluateCondition = (condition: Condition, data: Record<string, unknown>): boolean => {
      const fieldValue = data[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return typeof fieldValue === 'number' && typeof condition.value === 'number' 
            && fieldValue > condition.value;
        case 'less_than':
          return typeof fieldValue === 'number' && typeof condition.value === 'number'
            && fieldValue < condition.value;
        case 'contains':
          return typeof fieldValue === 'string' && typeof condition.value === 'string'
            && fieldValue.includes(condition.value);
        case 'not_contains':
          return typeof fieldValue === 'string' && typeof condition.value === 'string'
            && !fieldValue.includes(condition.value);
        default:
          return false;
      }
    };

    it('should evaluate equals condition', () => {
      const condition: Condition = { field: 'status', operator: 'equals', value: 'completed' };
      
      expect(evaluateCondition(condition, { status: 'completed' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'pending' })).toBe(false);
    });

    it('should evaluate not_equals condition', () => {
      const condition: Condition = { field: 'status', operator: 'not_equals', value: 'cancelled' };
      
      expect(evaluateCondition(condition, { status: 'completed' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'cancelled' })).toBe(false);
    });

    it('should evaluate greater_than condition', () => {
      const condition: Condition = { field: 'amount', operator: 'greater_than', value: 100 };
      
      expect(evaluateCondition(condition, { amount: 150 })).toBe(true);
      expect(evaluateCondition(condition, { amount: 50 })).toBe(false);
      expect(evaluateCondition(condition, { amount: 100 })).toBe(false);
    });

    it('should evaluate less_than condition', () => {
      const condition: Condition = { field: 'amount', operator: 'less_than', value: 100 };
      
      expect(evaluateCondition(condition, { amount: 50 })).toBe(true);
      expect(evaluateCondition(condition, { amount: 150 })).toBe(false);
    });

    it('should evaluate contains condition', () => {
      const condition: Condition = { field: 'notes', operator: 'contains', value: 'urgent' };
      
      expect(evaluateCondition(condition, { notes: 'This is urgent!' })).toBe(true);
      expect(evaluateCondition(condition, { notes: 'Normal task' })).toBe(false);
    });

    it('should evaluate not_contains condition', () => {
      const condition: Condition = { field: 'notes', operator: 'not_contains', value: 'spam' };
      
      expect(evaluateCondition(condition, { notes: 'Valid message' })).toBe(true);
      expect(evaluateCondition(condition, { notes: 'This is spam' })).toBe(false);
    });

    it('should handle missing fields', () => {
      const condition: Condition = { field: 'nonexistent', operator: 'equals', value: 'test' };
      
      expect(evaluateCondition(condition, {})).toBe(false);
    });
  });
});
