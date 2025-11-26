/**
 * SL18 Render Stack - Node Manager
 * Phase 8: Scaling & Deployment
 * 
 * Manages worker node registration, health monitoring, and scaling operations.
 */

import type {
  WorkerNode,
  NodeRegistry,
  NodeStatus,
  NodeRole,
  ScaleRequest,
  ScaleResult,
  ScalePolicy
} from './system.types.js';

// ============================================================================
// Constants
// ============================================================================

const HEARTBEAT_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_SCALE_POLICY: ScalePolicy = {
  minNodes: 1,
  maxNodes: 10,
  targetUtilization: 70,
  scaleUpThreshold: 50, // queue depth
  scaleDownThreshold: 5,
  cooldownPeriod: 300 // 5 minutes
};

// ============================================================================
// Node Registry State
// ============================================================================

const nodeRegistry: Map<string, WorkerNode> = new Map();
let lastScaleAction: Date | null = null;

// ============================================================================
// Node Registration
// ============================================================================

export function registerNode(node: Omit<WorkerNode, 'status'>): WorkerNode {
  const now = new Date().toISOString();
  const registeredNode: WorkerNode = {
    ...node,
    status: 'healthy',
    lastHeartbeat: now
  };
  
  nodeRegistry.set(node.id, registeredNode);
  return registeredNode;
}

export function deregisterNode(nodeId: string): boolean {
  return nodeRegistry.delete(nodeId);
}

export function updateNodeHeartbeat(nodeId: string): boolean {
  const node = nodeRegistry.get(nodeId);
  if (!node) {
    return false;
  }
  
  node.lastHeartbeat = new Date().toISOString();
  node.status = 'healthy';
  return true;
}

export function updateNodeStatus(nodeId: string, status: NodeStatus): boolean {
  const node = nodeRegistry.get(nodeId);
  if (!node) {
    return false;
  }
  
  node.status = status;
  return true;
}

export function updateNodeCapacity(nodeId: string, currentJobs: number): boolean {
  const node = nodeRegistry.get(nodeId);
  if (!node) {
    return false;
  }
  
  node.capacity.currentJobs = currentJobs;
  return true;
}

export function recordNodeJobComplete(nodeId: string, duration: number, success: boolean): boolean {
  const node = nodeRegistry.get(nodeId);
  if (!node) {
    return false;
  }
  
  node.performance.jobsProcessed++;
  
  // Update rolling average
  const prevTotal = node.performance.avgJobTime * (node.performance.jobsProcessed - 1);
  node.performance.avgJobTime = (prevTotal + duration) / node.performance.jobsProcessed;
  
  // Update error rate
  if (!success) {
    const totalJobs = node.performance.jobsProcessed;
    const prevErrors = (node.performance.errorRate / 100) * (totalJobs - 1);
    node.performance.errorRate = ((prevErrors + 1) / totalJobs) * 100;
  }
  
  return true;
}

// ============================================================================
// Node Queries
// ============================================================================

export function getNode(nodeId: string): WorkerNode | undefined {
  return nodeRegistry.get(nodeId);
}

export function getNodeRegistry(): NodeRegistry {
  // Check for stale nodes
  const now = Date.now();
  for (const node of nodeRegistry.values()) {
    const lastHeartbeat = new Date(node.lastHeartbeat).getTime();
    if (now - lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      node.status = 'offline';
    }
  }
  
  return {
    nodes: Array.from(nodeRegistry.values()),
    lastUpdated: new Date().toISOString()
  };
}

export function getNodesByRole(role: NodeRole): WorkerNode[] {
  return Array.from(nodeRegistry.values()).filter(n => n.role === role);
}

export function getHealthyNodes(): WorkerNode[] {
  return Array.from(nodeRegistry.values()).filter(n => n.status === 'healthy');
}

export function getNodeCount(): { total: number; healthy: number; byRole: Record<NodeRole, number> } {
  const nodes = Array.from(nodeRegistry.values());
  const byRole: Record<NodeRole, number> = {
    render: 0,
    publish: 0,
    'control-panel': 0,
    mixed: 0
  };
  
  for (const node of nodes) {
    byRole[node.role]++;
  }
  
  return {
    total: nodes.length,
    healthy: nodes.filter(n => n.status === 'healthy').length,
    byRole
  };
}

// ============================================================================
// Scaling Operations
// ============================================================================

export function getScalePolicy(): ScalePolicy {
  return { ...DEFAULT_SCALE_POLICY };
}

export async function executeScale(request: ScaleRequest): Promise<ScaleResult> {
  const now = new Date();
  const policy = getScalePolicy();
  
  // Check cooldown
  if (lastScaleAction) {
    const elapsed = (now.getTime() - lastScaleAction.getTime()) / 1000;
    if (elapsed < policy.cooldownPeriod) {
      return {
        success: false,
        action: request.action,
        previousCount: nodeRegistry.size,
        newCount: nodeRegistry.size,
        message: `Scale action blocked: cooldown period (${policy.cooldownPeriod - Math.floor(elapsed)}s remaining)`,
        timestamp: now.toISOString()
      };
    }
  }
  
  const previousCount = nodeRegistry.size;
  let newCount = previousCount;
  const affectedNodes: string[] = [];
  
  switch (request.action) {
    case 'scale-up': {
      const targetCount = request.targetCount ?? previousCount + 1;
      if (targetCount > policy.maxNodes) {
        return {
          success: false,
          action: request.action,
          previousCount,
          newCount: previousCount,
          message: `Cannot scale up: would exceed max nodes (${policy.maxNodes})`,
          timestamp: now.toISOString()
        };
      }
      
      // In production, this would trigger Kubernetes scaling
      // For now, simulate by registering placeholder nodes
      for (let i = previousCount; i < targetCount; i++) {
        const nodeId = `node-${Date.now()}-${i}`;
        registerNode({
          id: nodeId,
          name: `Worker Node ${i + 1}`,
          role: request.nodeRole ?? 'render',
          host: 'pending',
          port: 3000 + i,
          startedAt: now.toISOString(),
          lastHeartbeat: now.toISOString(),
          capacity: { maxConcurrentJobs: 4, currentJobs: 0, cpuCores: 4, memoryMb: 8192 },
          performance: { jobsProcessed: 0, avgJobTime: 0, errorRate: 0 },
          labels: { 'auto-scaled': 'true' }
        });
        affectedNodes.push(nodeId);
      }
      newCount = targetCount;
      break;
    }
    
    case 'scale-down': {
      const targetCount = request.targetCount ?? previousCount - 1;
      if (targetCount < policy.minNodes) {
        return {
          success: false,
          action: request.action,
          previousCount,
          newCount: previousCount,
          message: `Cannot scale down: would go below min nodes (${policy.minNodes})`,
          timestamp: now.toISOString()
        };
      }
      
      // Find nodes to remove (prefer idle nodes)
      const nodes = Array.from(nodeRegistry.values())
        .filter(n => n.labels['auto-scaled'] === 'true')
        .sort((a, b) => a.capacity.currentJobs - b.capacity.currentJobs);
      
      const toRemove = previousCount - targetCount;
      for (let i = 0; i < toRemove && i < nodes.length; i++) {
        deregisterNode(nodes[i].id);
        affectedNodes.push(nodes[i].id);
      }
      newCount = nodeRegistry.size;
      break;
    }
    
    case 'restart': {
      // Mark specified nodes for restart
      for (const node of nodeRegistry.values()) {
        if (!request.nodeRole || node.role === request.nodeRole) {
          node.status = 'degraded'; // Would trigger restart in production
          affectedNodes.push(node.id);
        }
      }
      break;
    }
    
    case 'drain': {
      // Mark nodes as draining (no new jobs)
      for (const node of nodeRegistry.values()) {
        if (!request.nodeRole || node.role === request.nodeRole) {
          node.status = 'degraded';
          node.labels['draining'] = 'true';
          affectedNodes.push(node.id);
        }
      }
      break;
    }
  }
  
  lastScaleAction = now;
  
  return {
    success: true,
    action: request.action,
    previousCount,
    newCount,
    message: `Scale action ${request.action} completed successfully`,
    timestamp: now.toISOString(),
    affectedNodes
  };
}

// ============================================================================
// Auto-scaling Recommendations
// ============================================================================

export function getScaleRecommendation(queueDepth: number, activeJobs: number): ScaleRequest | null {
  const policy = getScalePolicy();
  const healthyNodes = getHealthyNodes();
  
  if (healthyNodes.length === 0) {
    return {
      action: 'scale-up',
      targetCount: policy.minNodes,
      reason: 'No healthy nodes available'
    };
  }
  
  const totalCapacity = healthyNodes.reduce((sum, n) => sum + n.capacity.maxConcurrentJobs, 0);
  const utilization = totalCapacity > 0 ? (activeJobs / totalCapacity) * 100 : 0;
  
  // Scale up if queue is deep or utilization is high
  if (queueDepth > policy.scaleUpThreshold || utilization > policy.targetUtilization) {
    if (healthyNodes.length < policy.maxNodes) {
      return {
        action: 'scale-up',
        targetCount: Math.min(healthyNodes.length + 1, policy.maxNodes),
        reason: `High load: queue=${queueDepth}, utilization=${utilization.toFixed(1)}%`
      };
    }
  }
  
  // Scale down if queue is shallow and utilization is low
  if (queueDepth < policy.scaleDownThreshold && utilization < 20) {
    if (healthyNodes.length > policy.minNodes) {
      return {
        action: 'scale-down',
        targetCount: Math.max(healthyNodes.length - 1, policy.minNodes),
        reason: `Low load: queue=${queueDepth}, utilization=${utilization.toFixed(1)}%`
      };
    }
  }
  
  return null;
}

// ============================================================================
// Export
// ============================================================================

export * from './system.types.js';
