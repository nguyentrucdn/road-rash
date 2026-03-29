import { describe, it, expect } from 'vitest';
import { ObjectPool } from '@/utils/ObjectPool';

describe('ObjectPool', () => {
  it('creates objects on demand', () => {
    const pool = new ObjectPool(() => ({ value: 0 }), 5);
    const obj = pool.acquire();
    expect(obj).toEqual({ value: 0 });
  });
  it('reuses released objects', () => {
    const pool = new ObjectPool(() => ({ value: 0 }), 5);
    const obj1 = pool.acquire();
    obj1.value = 42;
    pool.release(obj1);
    const obj2 = pool.acquire();
    expect(obj2).toBe(obj1);
    expect(obj2.value).toBe(42);
  });
  it('pre-fills pool to initial size', () => {
    let createCount = 0;
    const pool = new ObjectPool(() => { createCount++; return {}; }, 3);
    expect(createCount).toBe(3);
  });
  it('creates new objects when pool is empty', () => {
    const pool = new ObjectPool(() => ({ id: Math.random() }), 1);
    const a = pool.acquire();
    const b = pool.acquire();
    expect(a).not.toBe(b);
  });
  it('releaseAll returns all active objects', () => {
    const pool = new ObjectPool(() => ({ v: 0 }), 0);
    pool.acquire();
    pool.acquire();
    pool.acquire();
    pool.releaseAll();
    const objs = [pool.acquire(), pool.acquire(), pool.acquire()];
    expect(objs.length).toBe(3);
  });
});
