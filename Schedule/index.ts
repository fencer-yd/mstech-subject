import {Observable, Observer, Subject, Subscription} from "rxjs";
import {share} from "rxjs/operators";
import {sleep} from "../utils";

enum Status {
  RUNNING = 1,
  UNKNOWN = 0
}

export default class Schedule<T> {
  private status: Status = Status.UNKNOWN;
  private ab: AbortController = new AbortController();
  private subject;
  private isDebug: boolean;
  private subscribeMap: Map<string, Subscription> = new Map<string, Subscription>()

  constructor(isDebug?: boolean) {
    this.isDebug = !!isDebug;
    this.subject = new Subject<T>();
    this.subject.subscribe({
      next: value => {
        if (this.isDebug) {
          console.log("------- schedule post -------");
          console.log(value);
          console.log("------- end schedule post -------");
        }
      },
      error: (e) => {
        console.warn("------- schedule error -------");
        console.warn(e.toString());
        console.warn("------- end schedule error -------");
      }, complete: () => {
        console.warn("------- schedule complete -------");
      }
    });
  }

  openDebug() {
    this.isDebug = true;
  }

  closeDebug() {
    this.isDebug = false;
  }

  addListener(key: string, cb: (data: T) => void) {
    const newObserver = this.subject.pipe(share());
    const observer = {
      next: cb,
      error: () => {},
      complete: () => {}
    }
    const subscribe =  newObserver.subscribe(observer);
    this.subscribeMap.set(key, subscribe);
  }

  removeListener(key: string) {
    const subscription = this.subscribeMap.get(key)
    subscription?.unsubscribe();
    this.subscribeMap.delete(key);
  }

  async start(scheduleFunc: () => Promise<T>, verify: (data: T) => boolean, duration?: number) {
    return new Promise<void>(async (resolve, reject) => {
      this.ab.signal.addEventListener('abort', reject);
      this.status = Status.RUNNING;
      await this.interval(scheduleFunc, verify, duration)
    })
  }

  stop() {
    this.ab.abort();
    this.status = Status.UNKNOWN;
    this.removeAll();
  }

  private removeAll() {
    this.subscribeMap.forEach((subscription) => {
      subscription?.unsubscribe();
    });
    this.subscribeMap.clear();
  }

  private postMessage(data: T) {
    this.subject.next(data);
  }

  private async interval(scheduleFunc: () => Promise<T>, verify: (data: T) => boolean, duration:number = 1000) {
    if (this.status === Status.RUNNING) {
      const data = await scheduleFunc();
      this.postMessage(data);
      const result = verify(data);
      if (result) {
        await sleep(duration);
        await this.interval(scheduleFunc, verify, duration);
      }
    }
  }
}
