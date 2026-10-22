import { handleBatchRequests } from "./handleBatchRequests.js";
import type { WriteRequest } from "./types/index.js";

const requests = (size: number): WriteRequest[] =>
  Array.from({ length: size }, (_, i) => ({ PutRequest: { Item: { pk: { N: String(i) } } } }));

describe("handleBatchRequests", () => {
  test("uses indexed chunks, clamps fractional sizes, and does not mutate input", async () => {
    const input = requests(8);
    const original = [...input];
    const submit = vi.fn(() => Promise.resolve(undefined));
    await handleBatchRequests(submit, input, { chunkSize: 3.9 });
    expect(submit.mock.calls).toHaveLength(3);
    expect(submit).toHaveBeenNthCalledWith(1, input.slice(0, 3));
    expect(submit).toHaveBeenNthCalledWith(3, input.slice(6));
    expect(input).toStrictEqual(original);
  });

  test("bounds concurrency and returns unprocessed chunks in input order", async () => {
    const input = requests(4);
    const pending = Array.from({ length: 4 }, () => Promise.withResolvers<WriteRequest[]>());
    let submitted = 0;
    let active = 0;
    let maximum = 0;
    const submit = vi.fn(async () => {
      const index = submitted++;
      maximum = Math.max(maximum, ++active);
      const result = await pending[index].promise;
      active--;
      return result;
    });
    const result = handleBatchRequests(submit, input, {
      chunkSize: 1,
      concurrency: 2,
      retryConfigs: { maxRetries: 0 },
    });
    expect(submitted).toBe(2);
    pending[1].resolve([input[1]]);
    await vi.waitFor(() => expect(submitted).toBe(3));
    pending[2].resolve([input[2]]);
    await vi.waitFor(() => expect(submitted).toBe(4));
    pending[3].resolve([input[3]]);
    pending[0].resolve([input[0]]);
    expect(await result).toStrictEqual(input);
    expect(maximum).toBe(2);
  });

  test("drains in-flight work and stops scheduling new chunks on failure", async () => {
    const pending = Promise.withResolvers<undefined>();
    const error = new Error("failed");
    const submit = vi.fn().mockRejectedValueOnce(error).mockReturnValueOnce(pending.promise);
    const result = handleBatchRequests(submit, requests(4), { chunkSize: 1, concurrency: 2 }).catch(
      (failure: unknown) => failure
    );
    await Promise.resolve();
    pending.resolve(undefined);
    expect(await result).toBe(error);
    expect(submit).toHaveBeenCalledTimes(2);
  });
});
