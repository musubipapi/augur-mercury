export async function runInPageContext(func: any, ...args: any[]) {
  const params = Object(func);

  const { doc = document, timeout } = params;

  if (typeof func !== "function") {
    func = params.func;
    args = params.args;
  }

  // test that we are running with the allow-scripts permission
  try {
    window.sessionStorage;
  } catch (ignore) {
    return null;
  }

  // returned value container
  const resultMessageId = parseInt(
    "" + Math.floor(Math.random() * 100 + 1) + new Date().getTime()
  );

  // prepare script container
  let scriptElm = doc.createElement("script");
  scriptElm.setAttribute("type", "application/javascript");

  const code = `
        (
            async function () {
                    const response = {
                        id: ${resultMessageId}
                    };
                    try {
                        response.result = JSON.stringify(await (${func})(...${JSON.stringify(
    args || []
  )})); // run script
                    } catch(err) {
                        response.error = JSON.stringify(err);
                    }

                    window.postMessage(response, '*');
            }
        )();
    `;

  // inject the script
  scriptElm.textContent = code;

  // run the script
  doc.documentElement.appendChild(scriptElm);

  // clean up script element
  scriptElm.remove();

  // create a "flat" promise
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // reject on timeout
  if (timeout !== undefined) {
    const timerId = setTimeout(() => {
      onResult({
        data: {
          id: resultMessageId,
          error: "Script timeout",
        },
      });
    }, timeout);

    // clear the timeout handler
    promise.finally(() => (timerId !== null ? clearTimeout(timerId) : null));
  }

  // resolve on result
  function onResult(event) {
    const data = Object(event.data);
    if (data.id === resultMessageId) {
      window.removeEventListener("message", onResult);
      if (data.error !== undefined) {
        return reject(JSON.parse(data.error));
      }
      return resolve(
        data.result !== undefined ? JSON.parse(data.result) : undefined
      );
    }
  }

  window.addEventListener("message", onResult);

  return promise;
}
