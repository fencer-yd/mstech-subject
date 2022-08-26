import { Observer, Subject, Subscription } from "rxjs";
import { share } from "rxjs/operators";

export interface BaseObservable<T> {
  type: string;
  payload?: T;
}

class SingleSubject<T> {
  private static _instance: SingleSubject<null>;
  isDebug: boolean = false;
  subject = new Subject<BaseObservable<T>>()

  static get instance() {
    if (this._instance) {
      return this._instance;
    } else {
      this._instance = new SingleSubject<null>();
      return this._instance;
    }
  }

  private constructor() {
    this.subject.subscribe({
      next: value => {
        if (this.isDebug) {
          console.log("------- singleSubject -------");
          console.log(`------- action: ${value.type} --------`);
          console.log('------- payload: ---------');
          console.log(value.payload);
          console.log("------- end singleSubject -------");
        }
      },
      error: (e) => {
        console.warn("------- singleSubject error -------");
        console.warn(e.toString());
        console.warn("------- end singleSubject error -------");
      }, complete: () => {
        console.warn("------- singleSubject complete -------");
      }
    });
  }

  add(observer: Observer<BaseObservable<T>>) {
    const newObserver = this.subject.pipe(share());
    return newObserver.subscribe(observer);
  }

  delete(subscription: Subscription) {
    subscription?.unsubscribe();
  }

  postMessage(params: BaseObservable<T>) {
    this.subject.next(params);
  }
}

export default SingleSubject.instance;

