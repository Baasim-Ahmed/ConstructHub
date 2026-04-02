export type DevRole = "ADMIN" | "MANAGER" | "ENGINEER" | "CLIENT";

// Global event emitter for role changes - completely isolated from context
let roleChangeListeners: ((role: DevRole) => void)[] = [];

export function notifyRoleChange(role: DevRole) {
  roleChangeListeners.forEach(listener => {
    try {
      listener(role);
    } catch (e) {
      // Silently ignore errors
    }
  });
}

export function onRoleChange(callback: (role: DevRole) => void) {
  roleChangeListeners.push(callback);
  return () => {
    roleChangeListeners = roleChangeListeners.filter(l => l !== callback);
  };
}
