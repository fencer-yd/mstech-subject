/*
 * @Author: fencer yangd@mshutech.com
 * @Date: 2022-12-05 14:18:26
 * @LastEditors: fencer yangd@mshutech.com
 * @LastEditTime: 2022-12-05 14:28:40
 * @FilePath: /mstech-subject/Abort/index.ts
 * @Description: abort
 */
import "reflect-metadata";

/**
 * @use
 **  @Abort<T>()
 **  function func(...args, ab?: AbortController) { ... }
 */

/**
 * @description add abort
 * @constructor
 */
export function Abort<T>() {
  return (_: any, __: string, descriptor: PropertyDescriptor) => {
    const func = descriptor.value;
    return {
      get() {
        const self = this;
        return function () {
          return new Promise<T>((resolve, reject) => {
            const [ab] = Array.prototype.slice.call(arguments, -1);
            const canAbort = ab instanceof AbortController;
            canAbort && ab.signal.addEventListener("abort", reject);
            const res = func.apply(self, arguments);
            canAbort && ab.signal.aborted && reject("aborted");
            if (res instanceof Promise) {
              res
                .then(resolve)
                .catch(console.error.bind(null, "[Abort Error]"))
                .finally(() => {
                  canAbort &&
                    ab.signal.removeEventListener(
                      "abort",
                      console.log.bind(null, "[Abort Removed]")
                    );
                });
            } else {
              canAbort &&
                ab.signal.removeEventListener(
                  "abort",
                  console.log.bind(null, "[Abort Removed]")
                );
              resolve(res);
            }
          });
        };
      },
    };
  };
}
