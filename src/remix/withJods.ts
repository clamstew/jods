export function withJods(
  stores: any[],
  loaderFn?: (args: any) => Promise<any>
) {
  return async (args: any) => {
    const jodsData: Record<string, any> = {};

    for (const store of stores) {
      const result = await store.loader?.(args);
      Object.assign(jodsData, result);
    }

    const userData = loaderFn ? await loaderFn(args) : {};
    return {
      ...userData,
      __jods: jodsData,
    };
  };
}
