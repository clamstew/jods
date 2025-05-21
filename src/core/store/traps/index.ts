export {
  ExtendedProxyContext,
  getRawValue,
  isPlainObject,
  arrayMutatorMethods,
  createComputedWrapper,
} from "./helpers";

export { getTrap, makeReactive } from "./get";
export { setTrap } from "./set";
export { deletePropertyTrap } from "./delete";
export { hasTrap, ownKeysTrap, getOwnPropertyDescriptorTrap } from "./other";
export { createProxyHandler } from "../proxy";
