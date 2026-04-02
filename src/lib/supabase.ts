// Compatibility shim to replace Supabase client with simple REST-backed helpers
// that call the app's API routes (which use Prisma -> Neon). This lets existing
// frontend code that imports `supabase` keep working with minimal edits.

import type { Client, Project, User, Task, Document } from '@prisma/client';

type SupabaseResponse = { data?: any; error?: any };

class FromShim {
  table: string;
  _method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | null = null;
  _payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) {
    this._method = 'GET';
    return this;
  }

  order(_field?: string, _opts?: any) {
    // Ignore server-side ordering here; API routes should provide appropriate ordering
    this._method = this._method || 'GET';
    return this;
  }

  async insert(payload: any[] | any): Promise<SupabaseResponse> {
    try {
      const body = Array.isArray(payload) ? payload[0] : payload;
      const res = await fetch(`/api/${this.table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  update(payload: any) {
    this._method = 'PATCH';
    this._payload = payload;
    return this;
  }

  delete() {
    this._method = 'DELETE';
    return this;
  }

  // support eq('id', value)
  async eq(field: string, value: string): Promise<SupabaseResponse> {
    try {
      if (field !== 'id') throw new Error('Shim supports only eq("id", value)');
      const url = `/api/${this.table}/${value}`;
      if (this._method === 'DELETE') {
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();
        return { data, error: null };
      }
      if (this._method === 'PATCH') {
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this._payload),
        });
        const data = await res.json();
        return { data, error: null };
      }
      return { data: null, error: new Error('Unsupported operation') };
    } catch (error) {
      return { data: null, error };
    }
  }

  // fallback to actually GET the collection
  async then(resolve: any, reject: any) {
    try {
      const res = await fetch(`/api/${this.table}`);
      const data = await res.json();
      return resolve({ data, error: null });
    } catch (err) {
      return resolve({ data: null, error: err });
    }
  }
}

export const supabase = {
  from: (table: string) => new FromShim(table),
};

// Re-export Prisma types for existing imports across the codebase
export type { Client, Project, User, Task, Document };
