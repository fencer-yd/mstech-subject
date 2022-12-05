/*
 * @Author: fencer yangd@mshutech.com
 * @Date: 2022-08-25 21:31:30
 * @LastEditors: fencer yangd@mshutech.com
 * @LastEditTime: 2022-12-05 14:23:43
 * @FilePath: /mstech-subject/SingleSubject/index.ts
 * @Description: single subject
 */
import { Subject, Subscription } from "rxjs";
import { share } from "rxjs/operators";

type StringFunc = () => string;

export interface BaseObservable<T> {
  type: string;
  payload?: T;
}

class SingleSubject {
  private static _instance: SingleSubject;
  isDebug: boolean = false;
  subject = new Subject<BaseObservable<any>>();

  static get instance() {
    if (this._instance) {
      return this._instance;
    } else {
      this._instance = new SingleSubject();
      return this._instance;
    }
  }

  private constructor() {
    this.subject.subscribe({
      next: (value) => {
        if (this.isDebug) {
          const { type, payload } = value;
          if (this.isDebug) {
            console.log("[Single-Subject action]", type);
            console.log("[Single-Subject payload]", payload);
          }
        }
      },
      error: (e) => {
        console.warn("[Single-Subject error]", e.toString());
      },
      complete: () => {
        console.log("[Single-Subject complete]");
      },
    });
  }

  addListener<T>(
    action: string | StringFunc,
    callback: (payload?: T) => void
  ): Subscription {
    const observer = {
      next: (data: BaseObservable<T>) => {
        const { type: target, payload } = data;
        const type = typeof action === "function" ? action() : action;
        if (type === target) {
          callback(payload);
        }
      },
    };
    const newObserver = this.subject.pipe(share());
    return newObserver.subscribe(observer);
  }

  removeListener(subscription: Subscription) {
    subscription?.unsubscribe();
  }

  removeListeners(subscriptions: Subscription[] = []) {
    subscriptions.forEach((item) => item?.unsubscribe());
  }

  post<T>(type: string, payload?: T) {
    this.subject.next({
      type,
      payload,
    });
  }
}

export default SingleSubject.instance;
