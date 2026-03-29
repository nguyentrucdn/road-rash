export class GameLoop {
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;
  private readonly fixedDtMs = 1000 / 60;
  private readonly maxStepsPerFrame = 5;
  private running = false;
  private lastTime = 0;
  private animFrameId = 0;

  constructor(
    private onUpdate: (dt: number) => void,
    private onRender: () => void,
  ) {}

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame((t) => this.frame(t));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
  }

  tick(elapsedMs: number): void {
    this.accumulator += elapsedMs;
    let steps = 0;
    while (this.accumulator >= this.fixedDtMs && steps < this.maxStepsPerFrame) {
      this.onUpdate(this.fixedDt);
      this.accumulator -= this.fixedDtMs;
      steps++;
    }
    if (steps >= this.maxStepsPerFrame) {
      this.accumulator = 0;
    }
    this.onRender();
  }

  private frame(time: number): void {
    if (!this.running) return;
    const elapsed = time - this.lastTime;
    this.lastTime = time;
    this.tick(elapsed);
    this.animFrameId = requestAnimationFrame((t) => this.frame(t));
  }
}
