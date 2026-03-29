export class ObjectPool<T> {
  private available: T[] = [];
  private active: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize: number) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    const obj = this.available.length > 0
      ? this.available.pop()!
      : this.factory();
    this.active.push(obj);
    return obj;
  }

  release(obj: T): void {
    const idx = this.active.indexOf(obj);
    if (idx !== -1) {
      this.active.splice(idx, 1);
    }
    this.available.push(obj);
  }

  releaseAll(): void {
    this.available.push(...this.active);
    this.active.length = 0;
  }

  get activeCount(): number {
    return this.active.length;
  }

  get availableCount(): number {
    return this.available.length;
  }
}
