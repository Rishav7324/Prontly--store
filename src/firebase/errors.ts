'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    super(`FirestoreError: Missing or insufficient permissions at ${context.path}`);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
