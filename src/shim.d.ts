import { ProtocolWithReturn } from "webext-bridge"

declare module "webext-bridge" {
  export interface ProtocolMap {
    "chrome-ai-context-menu": ProtocolWithReturn<{ selectionText?: string }, null>;
    "dummy": null
    // to specify the return type of the message,
    // use the `ProtocolWithReturn` type wrapper
    // bar: ProtocolWithReturn<CustomDataType, CustomReturnType>;
  }
}