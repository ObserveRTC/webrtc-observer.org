import { createLogger } from "../common/logger";

const logger = createLogger('IntervalTrackerService');

export class IntervalTrackerService {

    private _running = false;
    private readonly _queue: [name: string, (() => ReturnType<typeof setInterval>)][] = [];
    public readonly intervals = new Map<string, ReturnType<typeof setInterval>>();

    public addInterval(name: string, interval: () => ReturnType<typeof setInterval>) {
        this._queue.push([name, interval]);
    }

    public start() {
        if (this._running) {
            return;
        }
        this._running = true;
        
        for (const [name, interval] of this._queue) {
            if (this.intervals.has(name)) {
                logger.warn(`Interval ${name} already exists, clearing it`);

                clearInterval(this.intervals.get(name)!);
            }
            this.intervals.set(name, interval());
        }
    }

    public stop() {
        if (!this._running) {
            return;
        }
        this._running = false;
        this.intervals.forEach((interval) => clearInterval(interval));
        this.intervals.clear();
    }
}